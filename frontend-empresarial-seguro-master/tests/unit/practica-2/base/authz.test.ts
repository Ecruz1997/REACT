// Matriz de autorización — el test que previene la regresión más cara del sistema.
// Cada celda: (rol, misma sucursal, es creador, estado) -> permitido / motivo.
// La verificación del EFECTO en el repositorio vive en ../extra/authz-efecto.test.ts.
import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { obtenerSolicitud, listarSolicitudes } from '@/lib/solicitudes-service';
import { puedeResolverSolicitud, puedeVerSolicitud } from '@/lib/authz';
import { IDS, SUCURSAL_A, SUCURSAL_B, usuariosDemo, solicitudesDemo } from '@/lib/fixtures';
import type { Identidad, Solicitud } from '@/lib/types';

function identidad(usuarioId: string, rol: Identidad['rol'], sucursalId: string): Identidad {
  return { sesionId: 'sesion-test', usuarioId, rol, sucursalId };
}

const ANALISTA_A = identidad(IDS.analistaA, 'ANALISTA', SUCURSAL_A);
const APROBADOR_A = identidad(IDS.aprobadorA, 'APROBADOR', SUCURSAL_A);
const AUDITOR = identidad(IDS.auditor, 'AUDITOR', SUCURSAL_A);
const ANALISTA_B = identidad(IDS.analistaB, 'ANALISTA', SUCURSAL_B);

let repo: RepositorioMemoria;
beforeEach(() => {
  repo = new RepositorioMemoria({ usuarios: usuariosDemo(), solicitudes: solicitudesDemo() });
});

describe('puedeResolverSolicitud — matriz de decisión pura', () => {
  const solicitudPendienteA: Solicitud = solicitudesDemo()[0]; // creada por analistaA, sucursal A, PENDIENTE

  const casos: Array<{ nombre: string; actor: Identidad; esperado: boolean }> = [
    { nombre: 'analista de la misma sucursal NO puede aprobar', actor: ANALISTA_A, esperado: false },
    { nombre: 'aprobador de la misma sucursal (no creador) SÍ puede', actor: APROBADOR_A, esperado: true },
    { nombre: 'aprobador de OTRA sucursal NO puede', actor: identidad('x', 'APROBADOR', SUCURSAL_B), esperado: false },
    { nombre: 'auditor NO puede aprobar', actor: AUDITOR, esperado: false },
  ];

  it.each(casos)('$nombre', ({ actor, esperado }) => {
    expect(puedeResolverSolicitud(actor, solicitudPendienteA).permitido).toBe(esperado);
  });

  it('doble control: el creador (aunque sea aprobador) NO puede aprobar su propia solicitud', () => {
    const solicitudDelAprobador: Solicitud = { ...solicitudPendienteA, creadaPor: IDS.aprobadorA };
    expect(puedeResolverSolicitud(APROBADOR_A, solicitudDelAprobador).permitido).toBe(false);
  });

  it('no se puede resolver una solicitud ya resuelta', () => {
    const resuelta: Solicitud = { ...solicitudPendienteA, estado: 'APROBADA' };
    expect(puedeResolverSolicitud(APROBADOR_A, resuelta).permitido).toBe(false);
  });
});

describe('obtenerSolicitud — IDOR', () => {
  it('analista A NO puede ver solicitud de la sucursal B (devuelve null, como inexistente)', async () => {
    const s = await obtenerSolicitud(repo, ANALISTA_A, IDS.solicitudB);
    expect(s).toBeNull();
  });

  it('un id inexistente también devuelve null (indistinguible)', async () => {
    const s = await obtenerSolicitud(repo, ANALISTA_A, '99999999-9999-4999-9999-999999999999');
    expect(s).toBeNull();
  });

  it('auditor SÍ puede ver solicitud de cualquier sucursal', async () => {
    const s = await obtenerSolicitud(repo, AUDITOR, IDS.solicitudB);
    expect(s?.id).toBe(IDS.solicitudB);
  });

  it('puedeVerSolicitud: analista B ve la suya', () => {
    expect(puedeVerSolicitud(ANALISTA_B, solicitudesDemo()[1]).permitido).toBe(true);
  });
});

describe('listarSolicitudes — alcance por sucursal', () => {
  it('analista A solo ve solicitudes de su sucursal', async () => {
    const lista = await listarSolicitudes(repo, ANALISTA_A);
    expect(lista.length).toBeGreaterThan(0);
    // no debe aparecer la de sucursal B
    expect(lista.find((s) => s.id === IDS.solicitudB)).toBeUndefined();
  });

  it('auditor ve solicitudes de todas las sucursales', async () => {
    const lista = await listarSolicitudes(repo, AUDITOR);
    expect(lista.find((s) => s.id === IDS.solicitudB)).toBeDefined();
  });

  it('el listado nunca expone la cuenta completa (viene enmascarada)', async () => {
    const lista = await listarSolicitudes(repo, ANALISTA_A);
    for (const s of lista) {
      expect(s.cuentaEnmascarada).toMatch(/^•••• \d{4}$/);
      expect(s).not.toHaveProperty('cuentaDestino');
    }
  });
});
