// Ciclo de vida de tokens (Tema 1): access vs refresh, expiración, tipo y firma.
import { describe, it, expect } from 'vitest';
import {
  firmarAccess,
  firmarRefresh,
  verificar,
  ACCESS_TTL_SEGUNDOS,
} from '@/lib/tokens';
import type { Identidad } from '@/lib/types';

const SECRETO = 'secreto-de-prueba-suficientemente-largo-123';
const ID: Identidad = {
  sesionId: 's-1',
  usuarioId: 'u-1',
  rol: 'ANALISTA',
  sucursalId: 'suc-central',
};

describe('tokens', () => {
  it('un access token válido se verifica y devuelve la identidad', async () => {
    const token = await firmarAccess(ID, SECRETO);
    const id = await verificar(token, 'access', SECRETO);
    expect(id).toEqual(ID);
  });

  it('un access token NO se acepta como refresh (tipo distinto)', async () => {
    const token = await firmarAccess(ID, SECRETO);
    expect(await verificar(token, 'refresh', SECRETO)).toBeNull();
  });

  it('un refresh token NO se acepta como access', async () => {
    const token = await firmarRefresh(ID, SECRETO);
    expect(await verificar(token, 'access', SECRETO)).toBeNull();
  });

  it('un token firmado con otro secreto es rechazado', async () => {
    const token = await firmarAccess(ID, SECRETO);
    expect(await verificar(token, 'access', 'otro-secreto-distinto-pero-largo')).toBeNull();
  });

  it('un token manipulado es rechazado', async () => {
    const token = await firmarAccess(ID, SECRETO);
    const manipulado = token.slice(0, -3) + 'aaa';
    expect(await verificar(manipulado, 'access', SECRETO)).toBeNull();
  });

  it('rechaza un secreto demasiado corto al firmar', async () => {
    await expect(firmarAccess(ID, 'corto')).rejects.toThrow();
  });

  it('el access TTL es más corto que la ventana absoluta de refresh', () => {
    expect(ACCESS_TTL_SEGUNDOS).toBeLessThan(60 * 60 * 8);
  });
});
