import { describe, it, expect } from 'vitest';
import { validarDestino } from '@/lib/outbound';

describe('allowlist anti-SSRF', () => {
  it('permite un host de la allowlist por https', () => {
    expect(validarDestino('https://api.core.bancocr.fi.cr/saldo').permitido).toBe(true);
  });

  it('bloquea http (no https)', () => {
    expect(validarDestino('http://api.core.bancocr.fi.cr').permitido).toBe(false);
  });

  it('bloquea el endpoint de metadata de la nube', () => {
    expect(validarDestino('https://169.254.169.254/latest/meta-data').permitido).toBe(false);
  });

  it('bloquea localhost y rangos privados', () => {
    expect(validarDestino('https://localhost/x').permitido).toBe(false);
    expect(validarDestino('https://10.0.0.5/x').permitido).toBe(false);
    expect(validarDestino('https://192.168.1.1/x').permitido).toBe(false);
    expect(validarDestino('https://172.16.0.1/x').permitido).toBe(false);
  });

  it('bloquea un host que no está en la allowlist', () => {
    expect(validarDestino('https://evil.example.com').permitido).toBe(false);
  });

  it('rechaza una URL inválida', () => {
    expect(validarDestino('no-es-url').permitido).toBe(false);
  });
});
