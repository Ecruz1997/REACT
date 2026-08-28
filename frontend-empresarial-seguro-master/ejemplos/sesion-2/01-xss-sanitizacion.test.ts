// Sesión 2 · Tema 3 — Escapado de salida vs sanitización al escribir (§3.1–3.2).
//
// React escapa lo interpolado en JSX (defensa primaria, automática). Estos tests
// ejercitan la SEGUNDA mitad del patrón: cuando un campo admite HTML enriquecido
// (la justificación de una solicitud), se sanitiza AL ESCRIBIR con una allowlist,
// para que el dato limpio proteja a todos los consumidores (web, PDF, móvil).
import { describe, it, expect } from 'vitest';
import { sanitizarHtml } from '@/lib/sanitize';

describe('sanitización de HTML enriquecido (§3.2)', () => {
  it('conserva el formato permitido (b, em, p, listas)', () => {
    const limpio = sanitizarHtml('<p>Pago <b>urgente</b> según <em>contrato</em></p><ul><li>anexo 1</li></ul>');
    expect(limpio).toContain('<b>urgente</b>');
    expect(limpio).toContain('<em>contrato</em>');
    expect(limpio).toContain('<li>anexo 1</li>');
  });

  it('elimina <script> por completo (XSS almacenado clásico)', () => {
    const limpio = sanitizarHtml('Pago normal <script>fetch("/api/robar")</script> fin');
    expect(limpio).not.toContain('<script');
    expect(limpio).not.toContain('fetch');
    expect(limpio).toContain('Pago normal');
  });

  it('elimina handlers de evento: el vector no necesita <script>', () => {
    const limpio = sanitizarHtml('<p onmouseover="document.location=\'https://evil.example\'">texto</p>');
    expect(limpio).not.toContain('onmouseover');
    expect(limpio).toContain('texto');
  });

  it('elimina <img onerror=...>: ningún atributo sobrevive (ALLOWED_ATTR vacío)', () => {
    const limpio = sanitizarHtml('<img src="x" onerror="alert(document.cookie)">');
    expect(limpio).not.toContain('img');
    expect(limpio).not.toContain('onerror');
  });

  it('elimina <svg> e <iframe> (vectores de la tabla de §3.1)', () => {
    expect(sanitizarHtml('<svg><script>alert(1)</script></svg>')).not.toContain('svg');
    expect(sanitizarHtml('<iframe src="https://evil.example"></iframe>')).not.toContain('iframe');
  });

  it('el resultado es estable: sanitizar dos veces no cambia nada (anti-mXSS)', () => {
    // Si sanitizar(sanitizar(x)) !== sanitizar(x), el re-parseo del navegador puede
    // "resucitar" marcado — la clase de bug detrás del mXSS (§3.3).
    const sucio = '<p>texto <b>fuerte</b></p><noscript><style>x</style></noscript>';
    const unaVez = sanitizarHtml(sucio);
    expect(sanitizarHtml(unaVez)).toBe(unaVez);
  });
});
