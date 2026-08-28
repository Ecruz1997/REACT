// Sesión 1 · Tema 1 — HS256 vs RS256 y validación de claims (§1.5, a fondo).
//
// Cuando Bóveda firma SU PROPIA sesión, HS256 (simétrico) basta — eso hace src/lib/tokens.ts.
// Cuando el token lo firma un IdP corporativo (Entra ID, Keycloak), se verifica con la
// clave PÚBLICA (RS256/ES256) y hay que validar TODOS los claims de la tabla de la sesión:
//   iss  → aceptar tokens de otro emisor
//   aud  → reusar un token emitido para otra app
//   exp  → token expirado (jose lo valida siempre)
//   jti  → repetir un token capturado (anti-replay)
//   alg  → confusión de algoritmo (RS256→HS256)
// Este módulo NO está en src/lib/ porque Bóveda no integra un IdP; es el ejemplo de clase.
import { jwtVerify, type JWTPayload } from 'jose';

export interface OpcionesIdp {
  emisor: string;    // valor exacto esperado en `iss`
  audiencia: string; // valor exacto esperado en `aud`
}

// Verifica un token de IdP. Devuelve el payload o null — nunca lanza hacia el llamador.
// `jtiVistos` simula el registro de jtis consumidos (en producción: base o caché con TTL).
export async function verificarTokenIdp(
  token: string,
  clavePublica: CryptoKey,
  opciones: OpcionesIdp,
  jtiVistos: Set<string>,
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, clavePublica, {
      algorithms: ['RS256'],        // fijado: un token HS256 "confundido" no pasa
      issuer: opciones.emisor,      // valida iss
      audience: opciones.audiencia, // valida aud
      // exp y nbf los valida jose siempre; no hay forma de omitirlos por accidente.
    });
    // jti: cada token se acepta UNA vez. Sin esto, un token capturado se repite.
    if (typeof payload.jti !== 'string' || jtiVistos.has(payload.jti)) return null;
    jtiVistos.add(payload.jti);
    return payload;
  } catch {
    return null; // firma inválida, emisor/audiencia ajenos, expirado o malformado
  }
}
