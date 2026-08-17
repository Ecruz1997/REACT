// Servicio de solicitudes: orquesta verificar -> validar -> autorizar -> ejecutar -> auditar.
//
// Recibe la Identidad YA verificada y el repositorio por inyección. Es PURO respecto a Next
// (no lee cookies), así que se prueba de punta a punta con el repositorio en memoria.
// La capa de Server Actions (src/app/.../actions.ts) es una cáscara delgada que resuelve la
// identidad desde la cookie y delega aquí.
import type { Repositorio } from './repository';
import type { Identidad, Solicitud } from './types';
import { EsquemaCrearSolicitud, EsquemaResolver } from './schemas';
import { puedeCrearSolicitud, puedeResolverSolicitud, puedeVerSolicitud } from './authz';
import { sanitizarHtml } from './sanitize';
import type { ResultadoAccion } from './errors';
import { aListado, type SolicitudListado } from './masking';

export async function listarSolicitudes(
  repo: Repositorio,
  actor: Identidad,
): Promise<SolicitudListado[]> {
  // El filtro por autorización va en la CONSULTA, no en el componente.
  const filtro = actor.rol === 'AUDITOR' ? {} : { sucursalId: actor.sucursalId };
  const solicitudes = await repo.listarSolicitudes(filtro);
  return solicitudes.map(aListado);
}

// Devuelve la solicitud solo si el actor puede verla; si no, null indistinguible de "no existe" (anti-IDOR).
export async function obtenerSolicitud(
  repo: Repositorio,
  actor: Identidad,
  id: string,
): Promise<Solicitud | null> {
  const solicitud = await repo.buscarSolicitud(id);
  if (!solicitud) return null;
  const decision = puedeVerSolicitud(actor, solicitud);
  if (!decision.permitido) {
    await repo.registrarAuditoria({
      evento: 'ACCESO_DENEGADO',
      actorId: actor.usuarioId,
      ocurridoEn: new Date().toISOString(),
      metadatos: { recurso: 'solicitud', id, motivo: decision.motivo },
    });
    return null;
  }
  return solicitud;
}

export async function crearSolicitud(
  repo: Repositorio,
  actor: Identidad,
  entrada: unknown,
): Promise<ResultadoAccion<{ id: string }>> {
  const permiso = puedeCrearSolicitud(actor);
  if (!permiso.permitido) return { ok: false, error: permiso.motivo };

  const parsed = EsquemaCrearSolicitud.safeParse(entrada);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const solicitud = await repo.crearSolicitud({
    sucursalId: actor.sucursalId,
    creadaPor: actor.usuarioId,
    cuentaDestino: parsed.data.cuentaDestino,
    monto: parsed.data.monto,
    moneda: parsed.data.moneda,
    justificacion: sanitizarHtml(parsed.data.justificacion), // sanitizar AL ESCRIBIR
    estado: 'PENDIENTE',
    creadaEn: new Date().toISOString(),
    resueltaPor: null,
    resueltaEn: null,
  });

  await repo.registrarAuditoria({
    evento: 'SOLICITUD_CREADA',
    actorId: actor.usuarioId,
    ocurridoEn: new Date().toISOString(),
    metadatos: { solicitudId: solicitud.id },
  });

  return { ok: true, datos: { id: solicitud.id } };
}

async function resolver(
  repo: Repositorio,
  actor: Identidad,
  entrada: unknown,
  estado: 'APROBADA' | 'RECHAZADA',
): Promise<ResultadoAccion> {
  const parsed = EsquemaResolver.safeParse(entrada);
  if (!parsed.success) return { ok: false, error: 'Solicitud inválida' };

  const solicitud = await repo.buscarSolicitud(parsed.data.id);
  // Mismo mensaje ante inexistente y ante ajena: no filtra existencia.
  if (!solicitud) return { ok: false, error: 'Solicitud inválida' };

  const decision = puedeResolverSolicitud(actor, solicitud);
  if (!decision.permitido) {
    await repo.registrarAuditoria({
      evento: 'ACCESO_DENEGADO',
      actorId: actor.usuarioId,
      ocurridoEn: new Date().toISOString(),
      metadatos: { solicitudId: solicitud.id, accion: estado, motivo: decision.motivo },
    });
    return { ok: false, error: decision.motivo };
  }

  await repo.actualizarSolicitud(solicitud.id, {
    estado,
    resueltaPor: actor.usuarioId,
    resueltaEn: new Date().toISOString(),
  });

  await repo.registrarAuditoria({
    evento: estado === 'APROBADA' ? 'SOLICITUD_APROBADA' : 'SOLICITUD_RECHAZADA',
    actorId: actor.usuarioId,
    ocurridoEn: new Date().toISOString(),
    metadatos: { solicitudId: solicitud.id },
  });

  return { ok: true };
}

export function aprobarSolicitud(repo: Repositorio, actor: Identidad, entrada: unknown) {
  return resolver(repo, actor, entrada, 'APROBADA');
}
export function rechazarSolicitud(repo: Repositorio, actor: Identidad, entrada: unknown) {
  return resolver(repo, actor, entrada, 'RECHAZADA');
}
