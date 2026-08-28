// Sesión 3 · Extra — El DAL cierra el IDOR: el filtro va EN LA CONSULTA (§Extra/DAL).
//
// La página de la sesión: "recurso ajeno = inexistente". El servicio devuelve null
// tanto para una solicitud de otra sucursal como para un id que no existe — el
// atacante que enumera UUIDs no puede distinguir "no existe" de "existe pero no es tuya".
// Y el intento queda en bitácora, aunque la respuesta no lo delate.
import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { obtenerSolicitud } from '@/lib/solicitudes-service';
import { IDS, SUCURSAL_A, SUCURSAL_B, usuariosDemo, solicitudesDemo } from '@/lib/fixtures';
import type { Identidad } from '@/lib/types';

const ANALISTA_A: Identidad = {
  sesionId: 'sesion-demo', usuarioId: IDS.analistaA, rol: 'ANALISTA', sucursalId: SUCURSAL_A,
};
const AUDITOR: Identidad = {
  sesionId: 'sesion-demo', usuarioId: IDS.auditor, rol: 'AUDITOR', sucursalId: SUCURSAL_A,
};

let repo: RepositorioMemoria;
beforeEach(() => {
  repo = new RepositorioMemoria({ usuarios: usuariosDemo(), solicitudes: solicitudesDemo() });
});

describe('DAL anti-IDOR: ajeno = inexistente', () => {
  it('solicitud de OTRA sucursal → null (aunque el id sea válido y exista)', async () => {
    expect(await obtenerSolicitud(repo, ANALISTA_A, IDS.solicitudB)).toBeNull();
  });

  it('id inexistente → null. Indistinguible del caso anterior: eso ES la defensa', async () => {
    const inexistente = await obtenerSolicitud(repo, ANALISTA_A, '99999999-9999-4999-9999-999999999999');
    const ajena = await obtenerSolicitud(repo, ANALISTA_A, IDS.solicitudB);
    expect(inexistente).toBeNull();
    expect(ajena).toBeNull();
    expect(inexistente).toEqual(ajena); // misma respuesta exacta: nada que enumerar
  });

  it('la respuesta no delata, pero la bitácora SÍ registra el intento', async () => {
    await obtenerSolicitud(repo, ANALISTA_A, IDS.solicitudB);
    const bitacora = await repo.listarAuditoria();
    const intento = bitacora.find((a) => a.evento === 'ACCESO_DENEGADO');
    expect(intento).toBeDefined();
    expect(intento?.actorId).toBe(IDS.analistaA);
    expect(intento?.metadatos.id).toBe(IDS.solicitudB);
  });

  it('el auditor sí ve cualquier sucursal: el MISMO DAL, otra decisión', async () => {
    const s = await obtenerSolicitud(repo, AUDITOR, IDS.solicitudB);
    expect(s?.sucursalId).toBe(SUCURSAL_B);
  });

  it('la dueña de la sucursal ve la suya: la regla no rompe el caso legítimo', async () => {
    const s = await obtenerSolicitud(repo, ANALISTA_A, IDS.solicitudA);
    expect(s?.id).toBe(IDS.solicitudA);
  });
});
