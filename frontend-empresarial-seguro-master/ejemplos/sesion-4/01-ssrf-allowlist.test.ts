// Sesión 4 · Tema 8 — SSRF en el fetch de servidor: allowlist de destino (§8.3).
//
// Un fetch de servidor a una URL influida por el usuario alcanza lo que el SERVIDOR
// alcanza: metadata de nube, localhost, rangos privados. Cada test es una fila del
// mapa de ataque de la clase.
import { describe, it, expect } from 'vitest';
import { validarDestino, fetchSeguro } from '@/lib/outbound';

describe('validarDestino: la allowlist decide (§8.3)', () => {
  it('el host permitido, por https, pasa', () => {
    const r = validarDestino('https://api.core.bancocr.fi.cr/cuentas');
    expect(r.permitido).toBe(true);
  });

  it('el MISMO host por http se bloquea: el canal también cuenta', () => {
    expect(validarDestino('http://api.core.bancocr.fi.cr/cuentas').permitido).toBe(false);
  });

  it('metadata de nube (169.254.169.254): el premio clásico del SSRF', () => {
    expect(validarDestino('https://169.254.169.254/latest/meta-data/').permitido).toBe(false);
  });

  it('localhost y rangos privados: lo interno no se alcanza desde una URL de usuario', () => {
    for (const destino of [
      'https://localhost/admin',
      'https://127.0.0.1:8443/',
      'https://10.0.0.5/interno',
      'https://192.168.1.10/router',
      'https://172.16.0.1/panel',
      'https://[::1]/',
    ]) {
      expect(validarDestino(destino).permitido).toBe(false);
    }
  });

  it('un host público cualquiera tampoco pasa: allowlist, no blocklist', () => {
    const r = validarDestino('https://example.com/');
    expect(r.permitido).toBe(false);
    if (!r.permitido) expect(r.motivo).toContain('allowlist');
  });

  it('una no-URL se rechaza sin lanzar', () => {
    expect(validarDestino('esto no es una url').permitido).toBe(false);
  });
});

describe('fetchSeguro: la envoltura que hace imposible olvidarse', () => {
  it('un destino bloqueado lanza ANTES de tocar la red', async () => {
    await expect(fetchSeguro('https://169.254.169.254/latest/')).rejects.toThrow(/bloqueado/);
  });
  // El otro seguro de fetchSeguro no se ve en un unit test: redirect: 'error'.
  // Sin él, un host permitido puede responder 302 hacia 169.254.169.254 y el fetch
  // lo seguiría — la validación del host original no protege contra el salto.
});
