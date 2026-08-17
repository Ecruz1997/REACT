// Rotación de refresh token con detección de reuso (Tema 1, profundidad senior).
//
// El mecanismo que de verdad importa: cada vez que se usa un refresh token, se ROTA
// (se emite uno nuevo y el anterior deja de ser válido). Si alguien presenta un refresh
// que YA fue rotado, es señal de robo — se revoca la sesión entera.
//
// Es la defensa recomendada por la OAuth 2.0 Security BCP para clientes que no pueden
// guardar secretos de forma perfectamente segura (como un navegador).
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';
import type { Repositorio } from './repository';

const REFRESH_TTL = 60 * 60 * 8; // 8h

interface PayloadRefresh {
  sesionId: string;
  refreshId: string; // jti: identifica ESTA emisión del refresh
}

function clave(secreto: string): Uint8Array {
  if (!secreto || secreto.length < 16) throw new Error('Secreto inválido');
  return new TextEncoder().encode(secreto);
}

export function firmarRefreshToken(sesionId: string, refreshId: string, secreto: string): Promise<string> {
  return new SignJWT({ sesionId, refreshId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(refreshId)
    .setExpirationTime(Math.floor(Date.now() / 1000) + REFRESH_TTL)
    .sign(clave(secreto));
}

async function verificarRefreshToken(token: string, secreto: string): Promise<PayloadRefresh | null> {
  try {
    const { payload } = await jwtVerify(token, clave(secreto), { algorithms: ['HS256'] });
    const p = payload as unknown as PayloadRefresh;
    return p.sesionId && p.refreshId ? p : null;
  } catch { return null; }
}

export type ResultadoRotacion =
  | { ok: true; nuevoRefresh: string }
  | { ok: false; reuseDetectado: boolean };

// Rota el refresh: valida, detecta reuso y emite uno nuevo — o revoca ante robo.
export async function rotarRefresh(
  repo: Repositorio,
  tokenPresentado: string,
  secreto: string,
): Promise<ResultadoRotacion> {
  const p = await verificarRefreshToken(tokenPresentado, secreto);
  if (!p) return { ok: false, reuseDetectado: false };

  const sesion = await repo.buscarSesion(p.sesionId);
  if (!sesion || sesion.revocadaEn) return { ok: false, reuseDetectado: false };

  // Detección de reuso: el refresh presentado ya no es el vigente ⇒ fue rotado antes ⇒ robo.
  if (p.refreshId !== sesion.refreshActual) {
    await repo.revocarSesion(sesion.id); // se cae toda la sesión, no solo este token
    await repo.registrarAuditoria({
      evento: 'ACCESO_DENEGADO',
      actorId: sesion.usuarioId,
      ocurridoEn: new Date().toISOString(),
      metadatos: { motivo: 'reuso_de_refresh', sesionId: sesion.id },
    });
    return { ok: false, reuseDetectado: true };
  }

  // Rotación normal: nuevo refreshId, el anterior queda inválido.
  const nuevoId = randomUUID();
  await repo.rotarRefresh(sesion.id, nuevoId);
  return { ok: true, nuevoRefresh: await firmarRefreshToken(sesion.id, nuevoId, secreto) };
}
