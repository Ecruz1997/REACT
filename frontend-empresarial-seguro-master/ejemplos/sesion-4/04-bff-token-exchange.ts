// Sesión 4 · Tema 8 — BFF con token exchange on-behalf-of, RFC 8693 (§8.2, a fondo).
//
// Typecheck-only: el esqueleto del patrón, sin STS real detrás.
// El diagrama de la sesión, en código: el navegador SOLO tiene su cookie httpOnly;
// el BFF (este código, en el servidor) intercambia la identidad del usuario por un
// token PARA EL CORE — de vida corta y scope mínimo — que el navegador nunca ve.
import 'server-only';
import { fetchSeguro } from '@/lib/outbound';
import type { Identidad } from '@/lib/types';
import type { ResultadoAccion } from '@/lib/errors';

// Ambos hosts viven en la allowlist anti-SSRF de src/lib/outbound.ts (§8.3):
// el BFF no hace fetch a nada que no esté ahí, ni siquiera a su propio STS.
const URL_STS = 'https://api.core.bancocr.fi.cr/sts/token';
const URL_CORE = 'https://api.core.bancocr.fi.cr';

interface TokenParaElCore {
  access_token: string; // vida corta (minutos), scope acotado a UNA operación
  expires_in: number;
}

// Paso 1 — token exchange: la sesión del usuario se convierte en un token para el core
// con `act` (quién actúa) y scope mínimo. El core sabrá que fue "el BFF actuando
// en nombre de ana.analista", no un token de servicio anónimo todopoderoso.
async function intercambiarToken(actor: Identidad, scope: string): Promise<TokenParaElCore> {
  const respuesta = await fetchSeguro(URL_STS, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
      subject_token: actor.usuarioId, // en producción: el token de sesión verificado
      subject_token_type: 'urn:ietf:params:oauth:token-type:access_token',
      scope, // p. ej. 'cuentas:consultar' — nunca 'cuentas:*'
    }),
  });
  if (!respuesta.ok) throw new Error(`STS respondió ${respuesta.status}`);
  return (await respuesta.json()) as TokenParaElCore;
}

// Paso 2 — la llamada al core usa ese token efímero. Reglas del callout de la sesión:
// vida corta, scope mínimo, el navegador nunca lo ve, y el actor real queda en bitácora.
export async function consultarCuentaEnElCore(
  actor: Identidad,
  iban: string,
): Promise<ResultadoAccion<{ estado: string }>> {
  const token = await intercambiarToken(actor, 'cuentas:consultar');

  const respuesta = await fetchSeguro(`${URL_CORE}/cuentas/${encodeURIComponent(iban)}`, {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  if (!respuesta.ok) return { ok: false, error: 'No se pudo consultar la cuenta' };

  const datos = (await respuesta.json()) as { estado: string };
  return { ok: true, datos };
  // El token del core muere aquí: no se guarda, no se devuelve, no viaja al cliente.
}
