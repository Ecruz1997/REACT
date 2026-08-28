// Sesión 1 · Tema 1 — JWT: estructura y verificación (§1.2) · access vs refresh (§1.3).
//
// Demuestra en ejecución lo que la página de Notion afirma:
// - Un JWT está FIRMADO, no cifrado: cualquiera decodifica el payload sin el secreto.
// - Fijar el algoritmo al verificar no es opcional (alg:none).
// - El TIPO de token importa: un refresh no vale como access ni al revés.
import { describe, it, expect } from 'vitest';
import { firmarAccess, firmarRefresh, verificar, ACCESS_TTL_SEGUNDOS, REFRESH_TTL_SEGUNDOS } from '@/lib/tokens';
import type { Identidad } from '@/lib/types';

const SECRETO = 'secreto-de-clase-suficientemente-largo';
const IDENTIDAD: Identidad = {
  sesionId: 'sesion-demo',
  usuarioId: 'usuario-demo',
  rol: 'ANALISTA',
  sucursalId: 'suc-central',
};

describe('JWT: firmado, no cifrado (§1.2)', () => {
  it('el payload se decodifica SIN el secreto — nada sensible debe viajar ahí', async () => {
    const token = await firmarAccess(IDENTIDAD, SECRETO);
    const [, payloadB64] = token.split('.');
    // Esto es lo que hace jwt.io: base64url decode, sin verificar nada.
    const payload = JSON.parse(Buffer.from(payloadB64!, 'base64url').toString('utf8'));
    expect(payload.usuarioId).toBe('usuario-demo');
    expect(payload.rol).toBe('ANALISTA');
  });

  it('un token con alg:none NO pasa la verificación (el algoritmo está fijado)', async () => {
    // Token artesanal sin firma: header {alg:'none'} + payload creíble.
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const sinFirma = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({
      tipo: 'access', sesionId: 'x', usuarioId: 'x', rol: 'AUDITOR', sucursalId: 'x',
      exp: Math.floor(Date.now() / 1000) + 900,
    })}.`;
    expect(await verificar(sinFirma, 'access', SECRETO)).toBeNull();
  });

  it('alterar un solo carácter del payload invalida la firma', async () => {
    const token = await firmarAccess(IDENTIDAD, SECRETO);
    const [h, p, s] = token.split('.');
    const alterado = `${h}.${p!.slice(0, -2)}AA.${s}`;
    expect(await verificar(alterado, 'access', SECRETO)).toBeNull();
  });
});

describe('access vs refresh (§1.3)', () => {
  it('un access válido devuelve la identidad completa', async () => {
    const token = await firmarAccess(IDENTIDAD, SECRETO);
    const id = await verificar(token, 'access', SECRETO);
    expect(id).toEqual(IDENTIDAD);
  });

  it('un refresh NO vale como access (y viceversa): el tipo se verifica', async () => {
    const refresh = await firmarRefresh(IDENTIDAD, SECRETO);
    const access = await firmarAccess(IDENTIDAD, SECRETO);
    expect(await verificar(refresh, 'access', SECRETO)).toBeNull();
    expect(await verificar(access, 'refresh', SECRETO)).toBeNull();
  });

  it('vidas según la tabla de la sesión: access corto (15 min), refresh largo (8 h)', () => {
    expect(ACCESS_TTL_SEGUNDOS).toBe(60 * 15);
    expect(REFRESH_TTL_SEGUNDOS).toBe(60 * 60 * 8);
    expect(ACCESS_TTL_SEGUNDOS).toBeLessThan(REFRESH_TTL_SEGUNDOS);
  });
});
