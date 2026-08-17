import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { firmarAccess, firmarRefresh, verificar, ACCESS_TTL_SEGUNDOS, REFRESH_TTL_SEGUNDOS } from './tokens';
import { repo } from './db';
import type { Identidad } from './types';

// Prefijo __Host- omitido en dev (requiere HTTPS). En producción usar '__Host-boveda_access'.
const COOKIE_ACCESS = 'boveda_access';
const COOKIE_REFRESH = 'boveda_refresh';

function secreto(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET no configurado');
  return s;
}

const opcionesBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function establecerSesion(id: Identidad): Promise<void> {
  const store = await cookies();
  const [access, refresh] = await Promise.all([
    firmarAccess(id, secreto()),
    firmarRefresh(id, secreto()),
  ]);
  store.set(COOKIE_ACCESS, access, { ...opcionesBase, maxAge: ACCESS_TTL_SEGUNDOS });
  store.set(COOKIE_REFRESH, refresh, { ...opcionesBase, maxAge: REFRESH_TTL_SEGUNDOS });
}

export async function destruirSesion(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_ACCESS)?.value ?? store.get(COOKIE_REFRESH)?.value;
  if (token) {
    const id = (await verificar(token, 'access', secreto())) ?? (await verificar(token, 'refresh', secreto()));
    if (id) await repo().revocarSesion(id.sesionId);
  }
  store.delete(COOKIE_ACCESS);
  store.delete(COOKIE_REFRESH);
}

// Entrada única de verificación (el "DAL guard"). cache() la deduplica dentro de un render.
// El token válido NO basta: la sesión debe seguir viva en base (revocabilidad).
export const verificarSesion = cache(async (): Promise<Identidad | null> => {
  const store = await cookies();
  const access = store.get(COOKIE_ACCESS)?.value;
  if (!access) return null;

  const id = await verificar(access, 'access', secreto());
  if (!id) return null;

  const sesion = await repo().buscarSesion(id.sesionId);
  if (!sesion || sesion.revocadaEn) return null;

  await repo().tocarSesion(id.sesionId);
  return id;
});
