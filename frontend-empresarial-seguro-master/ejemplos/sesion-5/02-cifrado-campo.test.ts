// Sesión 5 · Tema 9 — Cifrado a nivel de campo: AES-256-GCM (§9.3, a fondo).
//
// GCM cifra Y autentica: si el ciphertext se altera, descifrar FALLA en vez de
// devolver basura silenciosa. Para un banco esa diferencia es integridad de datos.
import { describe, it, expect } from 'vitest';
import { cifrarCampo, descifrarCampo } from '@/lib/field-crypto';

const SECRETO = 'secreto-de-cifrado-de-clase-largo';
const CUENTA = 'CR12345678901234567890';

describe('cifrado de campo AES-256-GCM (§9.3)', () => {
  it('ida y vuelta: lo cifrado se recupera exacto', () => {
    expect(descifrarCampo(cifrarCampo(CUENTA, SECRETO), SECRETO)).toBe(CUENTA);
  });

  it('el ciphertext no contiene el valor en claro (ni un pedazo)', () => {
    const cifrado = cifrarCampo(CUENTA, SECRETO);
    expect(cifrado).not.toContain('CR123');
    expect(cifrado).not.toContain('7890');
  });

  it('cifrar dos veces lo MISMO da resultados distintos (IV aleatorio por operación)', () => {
    // Sin esto, dos filas con la misma cuenta serían visiblemente iguales en la base.
    expect(cifrarCampo(CUENTA, SECRETO)).not.toBe(cifrarCampo(CUENTA, SECRETO));
  });

  it('alterar UN carácter del ciphertext hace fallar el descifrado (autenticación GCM)', () => {
    const cifrado = cifrarCampo(CUENTA, SECRETO);
    // Se altera el PRIMER carácter del ciphertext (formato iv.tag.ciphertext): en base64url
    // sus 6 bits son todos significativos, así que el byte cambia seguro. Ojo con el ÚLTIMO
    // carácter: arrastra bits de relleno, y cambiarlo puede decodificar al MISMO byte —
    // el descifrado no fallaría y el test no probaría nada.
    const i = cifrado.lastIndexOf('.') + 1;
    const alterado = cifrado.slice(0, i) + (cifrado[i] === 'A' ? 'B' : 'A') + cifrado.slice(i + 1);
    expect(() => descifrarCampo(alterado, SECRETO)).toThrow();
  });

  it('el secreto equivocado no descifra (y falla, no devuelve basura)', () => {
    const cifrado = cifrarCampo(CUENTA, SECRETO);
    expect(() => descifrarCampo(cifrado, 'otro-secreto-igual-de-largo-x')).toThrow();
  });
});
