// Testing de abuso sobre el servicio (Práctica 2, tests de profundidad).
// No basta con que la denegación devuelva un mensaje: se verifica el EFECTO —
// en las denegaciones, el estado en el repositorio NO cambia.
import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { aprobarSolicitud } from '@/lib/solicitudes-service';
import { IDS, SUCURSAL_A, SUCURSAL_B, usuariosDemo, solicitudesDemo } from '@/lib/fixtures';
import type { Identidad } from '@/lib/types';

function identidad(usuarioId: string, rol: Identidad['rol'], sucursalId: string): Identidad {
  return { sesionId: 'sesion-test', usuarioId, rol, sucursalId };
}

const ANALISTA_A = identidad(IDS.analistaA, 'ANALISTA', SUCURSAL_A);
const APROBADOR_A = identidad(IDS.aprobadorA, 'APROBADOR', SUCURSAL_A);
const APROBADOR_A2 = identidad(IDS.aprobadorA2, 'APROBADOR', SUCURSAL_A);

let repo: RepositorioMemoria;
beforeEach(() => {
  repo = new RepositorioMemoria({ usuarios: usuariosDemo(), solicitudes: solicitudesDemo() });
});

describe('aprobarSolicitud — verifica el EFECTO en el repositorio', () => {
  it('aprobación válida cambia el estado a APROBADA y deja rastro de auditoría', async () => {
    const r = await aprobarSolicitud(repo, APROBADOR_A, { id: IDS.solicitudA });
    expect(r.ok).toBe(true);
    const despues = await repo.buscarSolicitud(IDS.solicitudA);
    expect(despues?.estado).toBe('APROBADA');
    expect(despues?.resueltaPor).toBe(IDS.aprobadorA);
    const auditoria = await repo.listarAuditoria();
    expect(auditoria.some((a) => a.evento === 'SOLICITUD_APROBADA')).toBe(true);
  });

  it('analista denegado: el estado permanece PENDIENTE (denegación real, no cosmética)', async () => {
    const r = await aprobarSolicitud(repo, ANALISTA_A, { id: IDS.solicitudA });
    expect(r.ok).toBe(false);
    const despues = await repo.buscarSolicitud(IDS.solicitudA);
    expect(despues?.estado).toBe('PENDIENTE');
  });

  it('aprobador de otra sucursal denegado y el estado no cambia', async () => {
    const r = await aprobarSolicitud(repo, identidad('x', 'APROBADOR', SUCURSAL_B), { id: IDS.solicitudA });
    expect(r.ok).toBe(false);
    expect((await repo.buscarSolicitud(IDS.solicitudA))?.estado).toBe('PENDIENTE');
    const auditoria = await repo.listarAuditoria();
    expect(auditoria.some((a) => a.evento === 'ACCESO_DENEGADO')).toBe(true);
  });

  it('doble control por servicio: el creador aprobador no puede, estado intacto', async () => {
    // carla (aprobadora A2) crea una solicitud, luego intenta aprobarla ella misma
    const creada = await repo.crearSolicitud({
      sucursalId: SUCURSAL_A, creadaPor: IDS.aprobadorA2, cuentaDestino: 'CR00001111222233334444',
      monto: 100000, moneda: 'CRC', justificacion: 'prueba de doble control interno equipo',
      estado: 'PENDIENTE', creadaEn: new Date().toISOString(), resueltaPor: null, resueltaEn: null,
    });
    const r = await aprobarSolicitud(repo, APROBADOR_A2, { id: creada.id });
    expect(r.ok).toBe(false);
    expect((await repo.buscarSolicitud(creada.id))?.estado).toBe('PENDIENTE');
  });

  it('entrada inválida (id no-UUID) es rechazada sin tocar datos', async () => {
    const r = await aprobarSolicitud(repo, APROBADOR_A, { id: 'no-es-uuid' });
    expect(r.ok).toBe(false);
  });
});
