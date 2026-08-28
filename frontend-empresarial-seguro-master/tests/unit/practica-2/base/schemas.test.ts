// Validación de entrada (Tema 3 / Tema 8).
import { describe, it, expect } from 'vitest';
import { EsquemaCrearSolicitud, EsquemaLogin } from '@/lib/schemas';

describe('EsquemaCrearSolicitud', () => {
  const base = {
    cuentaDestino: 'CR12345678901234567890',
    monto: 1000,
    moneda: 'CRC',
    justificacion: 'Justificación con longitud suficiente para pasar',
  };

  it('acepta datos válidos', () => {
    expect(EsquemaCrearSolicitud.safeParse(base).success).toBe(true);
  });

  it('rechaza monto negativo', () => {
    expect(EsquemaCrearSolicitud.safeParse({ ...base, monto: -5 }).success).toBe(false);
  });

  it('rechaza monto sobre el límite', () => {
    expect(EsquemaCrearSolicitud.safeParse({ ...base, monto: 99_000_000 }).success).toBe(false);
  });

  it('rechaza IBAN mal formado', () => {
    expect(EsquemaCrearSolicitud.safeParse({ ...base, cuentaDestino: 'US123' }).success).toBe(false);
  });

  it('rechaza justificación demasiado corta', () => {
    expect(EsquemaCrearSolicitud.safeParse({ ...base, justificacion: 'corto' }).success).toBe(false);
  });

  it('coacciona monto en string a número', () => {
    const r = EsquemaCrearSolicitud.safeParse({ ...base, monto: '1500' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.monto).toBe(1500);
  });
});

describe('EsquemaLogin', () => {
  it('rechaza contraseña demasiado corta', () => {
    expect(EsquemaLogin.safeParse({ usuario: 'ana', contrasena: '123' }).success).toBe(false);
  });
});
