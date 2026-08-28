// Sesión 5 · Anexo — Testing de abuso: verificar el EFECTO, no el mensaje.
//
// El callout amarillo de la sesión: "un test que solo mira el mensaje pasa igual si
// la acción escribió y luego devolvió 'No autorizado'". Cada caso denegado de esta
// matriz comprueba que el estado en el repositorio NO cambió.
// (La suite completa vive en tests/unit/practica-2/extra/authz-efecto.test.ts;
// esta es la forma parametrizada que se construye en vivo en la clase.)
import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { aprobarSolicitud } from '@/lib/solicitudes-service';
import { IDS, SUCURSAL_A, SUCURSAL_B, usuariosDemo, solicitudesDemo } from '@/lib/fixtures';
import type { Identidad, Rol } from '@/lib/types';

let repo: RepositorioMemoria;
beforeEach(() => {
  repo = new RepositorioMemoria({ usuarios: usuariosDemo(), solicitudes: solicitudesDemo() });
});

interface Caso {
  nombre: string;
  rol: Rol;
  sucursalId: string;
  usuarioId: string;
  ok: boolean;
}

// La matriz de abuso: quién intenta aprobar la solicitud PENDIENTE de la sucursal A
// (creada por el analista A). Solo una fila debe poder.
const casos: Caso[] = [
  { nombre: 'analista de la misma sucursal', rol: 'ANALISTA', sucursalId: SUCURSAL_A, usuarioId: IDS.analistaA, ok: false },
  { nombre: 'aprobador de la misma sucursal (no creador)', rol: 'APROBADOR', sucursalId: SUCURSAL_A, usuarioId: IDS.aprobadorA, ok: true },
  { nombre: 'aprobador de OTRA sucursal', rol: 'APROBADOR', sucursalId: SUCURSAL_B, usuarioId: 'intruso-b', ok: false },
  { nombre: 'auditor (lectura total no es escritura)', rol: 'AUDITOR', sucursalId: SUCURSAL_A, usuarioId: IDS.auditor, ok: false },
];

describe('matriz de abuso sobre el servicio puro (repo, actor, entrada)', () => {
  it.each(casos)('$nombre → ok:$ok', async (c) => {
    const actor: Identidad = {
      sesionId: 'sesion-abuso', usuarioId: c.usuarioId, rol: c.rol, sucursalId: c.sucursalId,
    };

    const r = await aprobarSolicitud(repo, actor, { id: IDS.solicitudA });
    expect(r.ok).toBe(c.ok);

    // La aserción que suele faltar: el estado en base.
    const despues = await repo.buscarSolicitud(IDS.solicitudA);
    expect(despues?.estado).toBe(c.ok ? 'APROBADA' : 'PENDIENTE'); // denegado ⇒ NO cambió
  });

  it('toda denegación deja rastro: la bitácora crece aunque el estado no cambie', async () => {
    const intruso: Identidad = {
      sesionId: 'sesion-abuso', usuarioId: 'intruso-b', rol: 'APROBADOR', sucursalId: SUCURSAL_B,
    };
    await aprobarSolicitud(repo, intruso, { id: IDS.solicitudA });
    const bitacora = await repo.listarAuditoria();
    expect(bitacora.some((a) => a.evento === 'ACCESO_DENEGADO')).toBe(true);
  });
});
