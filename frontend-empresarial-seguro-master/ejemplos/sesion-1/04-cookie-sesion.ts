// Sesión 1 · Tema 2 — La cookie de sesión: cuatro atributos, cuatro vectores (§2.1–2.2).
//
// Typecheck-only: requiere el runtime de Next (cookies()), no corre en Vitest.
// La versión de producción de Bóveda vive en src/lib/session.ts; este archivo aísla
// la decisión que la tabla de la sesión enseña, atributo por atributo.
import 'server-only';
import { cookies } from 'next/headers';

const ES_PRODUCCION = process.env.NODE_ENV === 'production';

// Prefijo __Host-: fija la cookie al host exacto y OBLIGA Secure + Path=/ (sin Domain).
// Exige HTTPS, así que en dev (http://localhost) se omite — por eso src/lib/session.ts
// usa 'boveda_access' a secas con el comentario de usar '__Host-boveda_access' en prod.
const NOMBRE_COOKIE = ES_PRODUCCION ? '__Host-boveda_access' : 'boveda_access';

export async function establecerCookieSesion(token: string): Promise<void> {
  const store = await cookies();
  store.set(NOMBRE_COOKIE, token, {
    httpOnly: true,          // el JS de la página (y un XSS) NO puede leerla
    secure: ES_PRODUCCION,   // solo viaja por HTTPS
    sameSite: 'lax',         // no se envía en requests cross-site (base anti-CSRF)
    path: '/',
    maxAge: 60 * 15,         // vida corta: igual al TTL del access token
  });
}

// La tabla "dónde vive cada cosa" (§2.2), en código:
// - Access/refresh token → cookie httpOnly (arriba). NUNCA localStorage: un solo XSS
//   con localStorage.getItem('token') entrega la sesión completa al atacante.
// - Rol para pintar UI → se deriva del token verificado en el servidor (verificarSesion()),
//   no de un estado que el cliente pueda editar.
// - Secreto de firma → process.env.SESSION_SECRET, sin prefijo NEXT_PUBLIC_ (nunca
//   cruza al bundle del navegador).
export function leerSecretoDeFirma(): string {
  const s = process.env.SESSION_SECRET; // sin NEXT_PUBLIC_: solo existe en el servidor
  if (!s) throw new Error('SESSION_SECRET no configurado');
  return s;
}
