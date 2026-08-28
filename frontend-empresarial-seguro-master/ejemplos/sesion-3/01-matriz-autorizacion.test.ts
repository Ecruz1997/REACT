// Sesión 3 · Extra — RBAC + ABAC y doble control: la tabla de la clase, ejecutable.
//
// RBAC decide por el ROL (solo APROBADOR aprueba, solo ANALISTA crea, solo AUDITOR
// ve la bitácora). ABAC agrega ATRIBUTOS del recurso y del contexto: misma sucursal,
// no ser el creador (doble control), estado PENDIENTE. La función pura devuelve una
// Decision con motivo — sin tocar base, sin Next, sin mocks.
import { describe, it, expect } from 'vitest';
import { puedeCrearSolicitud, puedeResolverSolicitud, puedeVerBitacora } from '@/lib/authz';
import { IDS, SUCURSAL_A, SUCURSAL_B, solicitudesDemo } from '@/lib/fixtures';
import type { Identidad, Rol, Solicitud } from '@/lib/types';

function actor(rol: Rol, sucursalId: string, usuarioId = `usuario-${rol}`): Identidad {
  return { sesionId: 'sesion-demo', usuarioId, rol, sucursalId };
}

// Solicitud PENDIENTE de la sucursal A, creada por el analista A (fixture compartida).
const pendienteA: Solicitud = solicitudesDemo()[0]!;

describe('RBAC: el rol decide la operación', () => {
  it.each<{ rol: Rol; crear: boolean; resolver: boolean; bitacora: boolean }>([
    { rol: 'ANALISTA', crear: true, resolver: false, bitacora: false },
    { rol: 'APROBADOR', crear: false, resolver: true, bitacora: false },
    { rol: 'AUDITOR', crear: false, resolver: false, bitacora: true },
  ])('$rol → crear:$crear resolver:$resolver bitácora:$bitacora', ({ rol, crear, resolver, bitacora }) => {
    const a = actor(rol, SUCURSAL_A);
    expect(puedeCrearSolicitud(a).permitido).toBe(crear);
    expect(puedeResolverSolicitud(a, pendienteA).permitido).toBe(resolver);
    expect(puedeVerBitacora(a).permitido).toBe(bitacora);
  });
});

describe('ABAC: los atributos del recurso también deciden', () => {
  it('mismo rol, otra sucursal: el aprobador de B no resuelve lo de A', () => {
    expect(puedeResolverSolicitud(actor('APROBADOR', SUCURSAL_B), pendienteA).permitido).toBe(false);
  });

  it('doble control: el creador no aprueba lo suyo aunque su rol se lo permita', () => {
    const propia: Solicitud = { ...pendienteA, creadaPor: IDS.aprobadorA };
    const elMismo = actor('APROBADOR', SUCURSAL_A, IDS.aprobadorA);
    expect(puedeResolverSolicitud(elMismo, propia).permitido).toBe(false);
    // Otro aprobador de la misma sucursal sí puede: la regla apunta a la PERSONA, no al rol.
    const colega = actor('APROBADOR', SUCURSAL_A, IDS.aprobadorA2);
    expect(puedeResolverSolicitud(colega, propia).permitido).toBe(true);
  });

  it('el estado es un atributo: una solicitud ya resuelta no se vuelve a resolver', () => {
    const resuelta: Solicitud = { ...pendienteA, estado: 'APROBADA' };
    expect(puedeResolverSolicitud(actor('APROBADOR', SUCURSAL_A), resuelta).permitido).toBe(false);
  });

  it('toda denegación trae su motivo (para la bitácora, no para el cliente)', () => {
    const d = puedeResolverSolicitud(actor('ANALISTA', SUCURSAL_A), pendienteA);
    expect(d.permitido).toBe(false);
    if (!d.permitido) expect(d.motivo.length).toBeGreaterThan(0);
  });
});
