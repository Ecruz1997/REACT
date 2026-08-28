// Sesión 5 · Tema 9 — Minimización y enmascaramiento en el servidor (§9.1–9.2).
//
// El listado envía SOLO lo necesario (proyección mínima); el valor completo no viaja
// "por si acaso". Enmascarar en el cliente sería cosmético: el dato ya habría llegado.
import { describe, it, expect } from 'vitest';
import { enmascararCuenta, enmascararCedula, aListado, type SolicitudListado } from '@/lib/masking';
import { solicitudesDemo } from '@/lib/fixtures';

describe('enmascaramiento (§9.2)', () => {
  it('la cuenta muestra solo los últimos 4 dígitos', () => {
    expect(enmascararCuenta('CR12345678901234567890')).toBe('•••• 7890');
  });

  it('la cédula oculta el bloque central', () => {
    expect(enmascararCedula('112340567')).toBe('1-••••-567');
  });

  it('las entradas demasiado cortas no filtran nada por accidente', () => {
    expect(enmascararCuenta('123')).toBe('••••');
    expect(enmascararCedula('12')).toBe('•••');
  });
});

describe('minimización: la proyección aListado (§9.1)', () => {
  const solicitud = solicitudesDemo()[0]!;

  it('el listado lleva la cuenta YA enmascarada, nunca la completa', () => {
    const listado = aListado(solicitud);
    expect(listado.cuentaEnmascarada).toBe('•••• 7890');
    // La propiedad con el valor completo NI EXISTE en el tipo que viaja:
    expect('cuentaDestino' in listado).toBe(false);
  });

  it('tampoco viajan los campos que el listado no necesita (justificación, creadaPor)', () => {
    const listado = aListado(solicitud);
    expect('justificacion' in listado).toBe(false);
    expect('creadaPor' in listado).toBe(false);
  });

  it('lo que sí necesita la tabla, va completo', () => {
    const esperado: SolicitudListado = {
      id: solicitud.id,
      cuentaEnmascarada: '•••• 7890',
      monto: solicitud.monto,
      moneda: solicitud.moneda,
      estado: solicitud.estado,
      creadaEn: solicitud.creadaEn,
    };
    expect(aListado(solicitud)).toEqual(esperado);
  });
});
