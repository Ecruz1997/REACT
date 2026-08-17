import { describe, it, expect } from 'vitest';
import { cifrarCampo, descifrarCampo, tokenizar } from '@/lib/field-crypto';

const SECRETO = 'secreto-de-cifrado-suficientemente-largo';

describe('cifrado a nivel de campo (AES-256-GCM)', () => {
  it('ida y vuelta recupera el valor', () => {
    const cifrado = cifrarCampo('CR12345678901234567890', SECRETO);
    expect(descifrarCampo(cifrado, SECRETO)).toBe('CR12345678901234567890');
  });

  it('el ciphertext no contiene el texto plano', () => {
    const cifrado = cifrarCampo('dato-secreto', SECRETO);
    expect(cifrado).not.toContain('dato-secreto');
  });

  it('cifrar dos veces da resultados distintos (IV aleatorio)', () => {
    expect(cifrarCampo('x', SECRETO)).not.toBe(cifrarCampo('x', SECRETO));
  });

  it('alterar el ciphertext hace fallar el descifrado (autenticación)', () => {
    const cifrado = cifrarCampo('valor', SECRETO);
    const partes = cifrado.split('.');
    partes[2] = partes[2].slice(0, -2) + 'AA'; // manipular
    expect(() => descifrarCampo(partes.join('.'), SECRETO)).toThrow();
  });

  it('descifrar con secreto equivocado falla', () => {
    const cifrado = cifrarCampo('valor', SECRETO);
    expect(() => descifrarCampo(cifrado, 'otro-secreto-distinto-largo-xyz')).toThrow();
  });

  it('tokenizar es determinista y no reversible al ojo', () => {
    const t1 = tokenizar('CR123', SECRETO);
    const t2 = tokenizar('CR123', SECRETO);
    expect(t1).toBe(t2);
    expect(t1).not.toContain('CR123');
  });
});
