'use server';
// Sesión 2 · Tema 3 — CSRF en el App Router (§3.4). Typecheck-only (requiere runtime de Next).
//
// Las tres defensas de la tabla de la sesión, y dónde vive cada una:
//   1. Cookie SameSite=Lax        → src/lib/session.ts (el navegador no la envía cross-site)
//   2. Validación de Origin/Host  → la hace Next.js en TODA Server Action, automática
//   3. Server Actions solo POST   → no se disparan con <img src> ni con un GET
//
// Conclusión de la clase: una mutación expuesta como Server Action YA tiene protección
// CSRF de base. El error clásico es sacar la mutación a una ruta GET propia
// (app/api/aprobar/route.ts con export function GET), que NO goza de ninguna de las tres:
// un <img src="/api/aprobar?id=123"> en cualquier página la dispararía con las cookies
// del usuario. Regla: mutación ⇒ Server Action (o POST con verificación explícita), nunca GET.
import { verificarSesion } from '@/lib/session';
import { repo } from '@/lib/db';
import * as servicio from '@/lib/solicitudes-service';
import type { ResultadoAccion } from '@/lib/errors';

export async function aprobarConProteccionCsrf(entrada: unknown): Promise<ResultadoAccion> {
  // Para cuando esta línea corre, Next ya rechazó: métodos distintos de POST y
  // requests cuyo Origin no coincide con el Host. Lo que SIGUE siendo nuestro
  // trabajo es la autenticación y la autorización:
  const actor = await verificarSesion();
  if (!actor) return { ok: false, error: 'No autenticado' };
  return servicio.aprobarSolicitud(repo(), actor, entrada);
}
