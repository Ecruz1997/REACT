// Sesión 2 · Tema 3 — URLs en href/src: React NO valida esquemas (§3.1, tabla de vectores).
//
// <a href={urlDelUsuario}> con "javascript:alert(1)" es XSS aunque React escape el texto.
// La defensa es una allowlist de esquemas ANTES de renderizar.
import { describe, it, expect } from 'vitest';
import { enlaceSeguro } from '@/lib/sanitize';

describe('allowlist de esquemas de URL (§3.1)', () => {
  it('permite https, http y mailto', () => {
    expect(enlaceSeguro('https://www.bancobcr.com/ayuda')).toBe('https://www.bancobcr.com/ayuda');
    expect(enlaceSeguro('http://intranet.example/manual')).toBe('http://intranet.example/manual');
    expect(enlaceSeguro('mailto:soporte@bancobcr.com')).toBe('mailto:soporte@bancobcr.com');
  });

  it('bloquea javascript: — el clásico', () => {
    expect(enlaceSeguro('javascript:alert(document.cookie)')).toBeNull();
  });

  it('bloquea data: y otros esquemas fuera de la allowlist', () => {
    expect(enlaceSeguro('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(enlaceSeguro('vbscript:msgbox(1)')).toBeNull();
  });

  it('bloquea los disfraces: espacios, mayúsculas y saltos de línea no lo salvan', () => {
    // El parser de URL normaliza antes de comparar — por eso se valida con new URL()
    // y no con startsWith('javascript:').
    expect(enlaceSeguro('  JaVaScRiPt:alert(1)')).toBeNull();
    expect(enlaceSeguro('java\nscript:alert(1)')).toBeNull();
  });

  it('una ruta relativa se resuelve contra la base propia (no es un vector)', () => {
    expect(enlaceSeguro('/solicitudes')).toBe('https://boveda.interno/solicitudes');
  });
});
