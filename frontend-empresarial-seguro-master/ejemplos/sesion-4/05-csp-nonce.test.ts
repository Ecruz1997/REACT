// Sesión 4 · Extra — Lo que el grading verifica por HTTP, aquí en unit:
// nonce presente y único, sin 'unsafe-inline' en script-src, frame-ancestors 'none'.
import { describe, it, expect } from 'vitest';
import { construirCsp, generarNonce } from './05-csp-nonce';

describe('CSP con nonce (Endurecimiento)', () => {
  it('script-src lleva el nonce y strict-dynamic, y NO lleva unsafe-inline', () => {
    const csp = construirCsp('abc123');
    const scriptSrc = csp.split('; ').find((d) => d.startsWith('script-src'))!;
    expect(scriptSrc).toContain(`'nonce-abc123'`);
    expect(scriptSrc).toContain(`'strict-dynamic'`);
    expect(scriptSrc).not.toContain('unsafe-inline'); // el punto entero de usar nonce
  });

  it('frame-ancestors none y object-src none: los clásicos cerrados', () => {
    const csp = construirCsp(generarNonce());
    expect(csp).toContain(`frame-ancestors 'none'`);
    expect(csp).toContain(`object-src 'none'`);
  });

  it('el nonce es distinto en cada request: uno filtrado ayer no sirve hoy', () => {
    const nonces = new Set([generarNonce(), generarNonce(), generarNonce()]);
    expect(nonces.size).toBe(3);
    for (const n of nonces) expect(construirCsp(n)).toContain(`'nonce-${n}'`);
  });
});
