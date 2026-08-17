// Emisión y verificación de tokens (Tema 1: JWT, ciclo de vida, access vs refresh).
//
// Modelo de banca: sesión REVOCABLE. Usamos JWT firmados de vida corta, pero
// respaldados por un registro de sesión en base — el token válido no basta si la
// sesión fue revocada. Así se combina la ergonomía del JWT con la revocabilidad
// que un entorno regulado exige.
//
// - ACCESS token:  vida corta (minutos). Autoriza cada request. Se renueva seguido.
// - REFRESH token: vida más larga (horas). Solo sirve para emitir un nuevo access.
//   Se ROTA en cada uso (detección de reuso).
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import type { Identidad } from './types';

export const ACCESS_TTL_SEGUNDOS = 60 * 15; // 15 min (inactividad)
export const REFRESH_TTL_SEGUNDOS = 60 * 60 * 8; // 8 h (vida absoluta)

export type TipoToken = 'access' | 'refresh';

interface PayloadToken extends JWTPayload {
  tipo: TipoToken;
  sesionId: string;
  usuarioId: string;
  rol: Identidad['rol'];
  sucursalId: string;
}

function clave(secreto: string): Uint8Array {
  if (!secreto || secreto.length < 16) {
    throw new Error('SESSION_SECRET ausente o demasiado corto');
  }
  return new TextEncoder().encode(secreto);
}

async function firmar(
  identidad: Identidad,
  tipo: TipoToken,
  ttl: number,
  secreto: string,
): Promise<string> {
  return new SignJWT({
    tipo,
    sesionId: identidad.sesionId,
    usuarioId: identidad.usuarioId,
    rol: identidad.rol,
    sucursalId: identidad.sucursalId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
    .sign(clave(secreto));
}

export function firmarAccess(id: Identidad, secreto: string): Promise<string> {
  return firmar(id, 'access', ACCESS_TTL_SEGUNDOS, secreto);
}

export function firmarRefresh(id: Identidad, secreto: string): Promise<string> {
  return firmar(id, 'refresh', REFRESH_TTL_SEGUNDOS, secreto);
}

// Verifica firma, expiración, algoritmo y TIPO esperado.
// Fijar algorithms explícitamente NO es opcional: sin ello, un token con alg:none
// podría aceptarse. Es una de las fallas históricas más explotadas de JWT.
export async function verificar(
  token: string,
  tipoEsperado: TipoToken,
  secreto: string,
): Promise<Identidad | null> {
  try {
    const { payload } = await jwtVerify(token, clave(secreto), { algorithms: ['HS256'] });
    const p = payload as PayloadToken;
    if (p.tipo !== tipoEsperado) return null;
    return {
      sesionId: p.sesionId,
      usuarioId: p.usuarioId,
      rol: p.rol,
      sucursalId: p.sucursalId,
    };
  } catch {
    return null; // firma inválida, expirado o malformado
  }
}
