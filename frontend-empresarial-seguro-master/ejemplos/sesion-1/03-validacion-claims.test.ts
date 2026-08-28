// Sesión 1 · Tema 1 — La tabla de claims de §1.5, fila por fila, en ejecución.
// Cada test es un ataque de la columna "Ataque si se omite".
import { describe, it, expect, beforeEach } from 'vitest';
import { SignJWT, generateKeyPair } from 'jose';
import { verificarTokenIdp } from './03-validacion-claims';

const EMISOR = 'https://idp.bancocr.fi.cr';
const AUDIENCIA = 'boveda';
const OPCIONES = { emisor: EMISOR, audiencia: AUDIENCIA };

let claves: Awaited<ReturnType<typeof generateKeyPair>>;
let jtiVistos: Set<string>;

beforeEach(async () => {
  claves = await generateKeyPair('RS256');
  jtiVistos = new Set();
});

function tokenBase(): SignJWT {
  return new SignJWT({ usuario: 'ana.analista' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .setJti(crypto.randomUUID());
}

describe('validación de claims de un IdP (§1.5)', () => {
  it('un token correcto (iss + aud + exp + jti) pasa', async () => {
    const token = await tokenBase().setIssuer(EMISOR).setAudience(AUDIENCIA).sign(claves.privateKey);
    const payload = await verificarTokenIdp(token, claves.publicKey, OPCIONES, jtiVistos);
    expect(payload?.usuario).toBe('ana.analista');
  });

  it('iss: un token de OTRO emisor se rechaza aunque la firma sea válida', async () => {
    const token = await tokenBase().setIssuer('https://idp-pirata.example').setAudience(AUDIENCIA).sign(claves.privateKey);
    expect(await verificarTokenIdp(token, claves.publicKey, OPCIONES, jtiVistos)).toBeNull();
  });

  it('aud: un token emitido para OTRA app se rechaza (mismo IdP, audiencia distinta)', async () => {
    const token = await tokenBase().setIssuer(EMISOR).setAudience('otra-app-del-banco').sign(claves.privateKey);
    expect(await verificarTokenIdp(token, claves.publicKey, OPCIONES, jtiVistos)).toBeNull();
  });

  it('exp: un token expirado se rechaza', async () => {
    const token = await new SignJWT({ usuario: 'ana.analista' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(EMISOR).setAudience(AUDIENCIA)
      .setJti(crypto.randomUUID())
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60) // expiró hace 1 min
      .sign(claves.privateKey);
    expect(await verificarTokenIdp(token, claves.publicKey, OPCIONES, jtiVistos)).toBeNull();
  });

  it('jti: el MISMO token no se acepta dos veces (anti-replay)', async () => {
    const token = await tokenBase().setIssuer(EMISOR).setAudience(AUDIENCIA).sign(claves.privateKey);
    expect(await verificarTokenIdp(token, claves.publicKey, OPCIONES, jtiVistos)).not.toBeNull();
    expect(await verificarTokenIdp(token, claves.publicKey, OPCIONES, jtiVistos)).toBeNull();
  });

  it('sin jti no hay forma de detectar replay: se rechaza', async () => {
    const token = await new SignJWT({ usuario: 'ana.analista' })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(EMISOR).setAudience(AUDIENCIA)
      .setExpirationTime('5m')
      .sign(claves.privateKey);
    expect(await verificarTokenIdp(token, claves.publicKey, OPCIONES, jtiVistos)).toBeNull();
  });
});
