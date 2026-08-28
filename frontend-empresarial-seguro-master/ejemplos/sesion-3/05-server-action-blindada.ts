'use server';
// Sesión 3 · Extra — Server Action = endpoint público. Typecheck-only (runtime de Next).
//
// El callout rojo de la sesión, en código: toda Server Action se puede invocar con curl,
// así que antes de tocar un dato hace SIEMPRE los tres pasos:
//   1. verificar identidad   — de la cookie, nunca por parámetro
//   2. validar la entrada    — es `unknown` hasta que un esquema diga lo contrario
//   3. autorizar SOBRE ESE registro — y auditar la decisión
// En Bóveda la acción es una cáscara delgada: los pasos 2 y 3 viven en el servicio puro
// (src/lib/solicitudes-service.ts), que es donde se prueban exhaustivamente.
import { verificarSesion } from '@/lib/session';
import { repo } from '@/lib/db';
import * as servicio from '@/lib/solicitudes-service';
import type { ResultadoAccion } from '@/lib/errors';

export async function aprobarSolicitudEjemplo(entrada: unknown): Promise<ResultadoAccion> {
  // 1. Identidad desde la cookie. Si la firma es válida pero la sesión fue revocada
  //    en base, verificarSesion() también devuelve null (sesión revocable, Sesión 1).
  const actor = await verificarSesion();
  if (!actor) return { ok: false, error: 'No autenticado' };

  // 2 y 3. El servicio valida el esquema (id UUID), decide con la matriz RBAC/ABAC
  //    (rol + sucursal + doble control + estado) y audita — incluida la denegación.
  //    La entrada viaja como `unknown`: nadie aguas abajo confía en su forma.
  return servicio.aprobarSolicitud(repo(), actor, entrada);

  // Lo que NUNCA se hace: recibir la identidad por parámetro —
  //   aprobarSolicitud({ actor, id })  ← curl mandaría el actor que quiera.
  // La sesión se RESUELVE aquí adentro; el cliente no participa en decirnos quién es.
}
