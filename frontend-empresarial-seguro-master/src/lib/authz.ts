// Motor de autorización: RBAC + ABAC (Tema 5). Lógica PURA y determinista.
// No toca base de datos, ni cookies, ni Next. Por eso se puede probar exhaustivamente
// con una matriz de casos — que es la defensa central contra regresiones.
import type { Identidad, Solicitud, Rol } from './types';

export type Decision =
  | { permitido: true }
  | { permitido: false; motivo: string };

const PERMITIR: Decision = { permitido: true };
function denegar(motivo: string): Decision {
  return { permitido: false, motivo };
}

// ¿Puede este actor VER esta solicitud?
// Analista y aprobador: solo su sucursal. Auditor: todo (lectura).
export function puedeVerSolicitud(actor: Identidad, solicitud: Solicitud): Decision {
  if (actor.rol === 'AUDITOR') return PERMITIR;
  if (solicitud.sucursalId !== actor.sucursalId) {
    return denegar('La solicitud pertenece a otra sucursal');
  }
  return PERMITIR;
}

// ¿Puede este actor CREAR solicitudes?
export function puedeCrearSolicitud(actor: Identidad): Decision {
  if (actor.rol !== 'ANALISTA') {
    return denegar('Solo un analista puede crear solicitudes');
  }
  return PERMITIR;
}

// ¿Puede este actor APROBAR/RECHAZAR esta solicitud?
// RBAC: debe ser APROBADOR.
// ABAC: misma sucursal, la solicitud debe estar PENDIENTE,
//       y — doble control — no puede ser quien la creó.
export function puedeResolverSolicitud(actor: Identidad, solicitud: Solicitud): Decision {
  if (actor.rol !== 'APROBADOR') {
    return denegar('Solo un aprobador puede resolver solicitudes');
  }
  if (solicitud.sucursalId !== actor.sucursalId) {
    return denegar('La solicitud pertenece a otra sucursal');
  }
  if (solicitud.estado !== 'PENDIENTE') {
    return denegar('La solicitud ya fue resuelta');
  }
  if (solicitud.creadaPor === actor.usuarioId) {
    return denegar('No puede aprobar una solicitud creada por usted mismo (doble control)');
  }
  return PERMITIR;
}

// ¿Puede este actor ver la bitácora de auditoría completa?
export function puedeVerBitacora(actor: Identidad): Decision {
  if (actor.rol !== 'AUDITOR') {
    return denegar('Solo un auditor puede consultar la bitácora');
  }
  return PERMITIR;
}

// Matriz declarativa, útil para documentación y para generar los tests.
export const MATRIZ_ROLES: Record<Rol, string> = {
  ANALISTA: 'Crea solicitudes; ve solo su sucursal',
  APROBADOR: 'Resuelve solicitudes de su sucursal (no las propias)',
  AUDITOR: 'Lectura total, incluida la bitácora',
};
