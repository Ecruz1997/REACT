'use server';

import { revalidatePath } from 'next/cache';
import { verificarSesion } from '@/lib/session';
import { repo } from '@/lib/db';
import * as servicio from '@/lib/solicitudes-service';
import type { ResultadoAccion } from '@/lib/errors';

// Cada acción: resuelve identidad desde la cookie, luego delega al servicio puro.
// La firma NO recibe la sesión por parámetro (se toma del contexto de cookies).

export async function crearSolicitud(entrada: unknown): Promise<ResultadoAccion<{ id: string }>> {
  const actor = await verificarSesion();
  if (!actor) return { ok: false, error: 'No autenticado' };
  const r = await servicio.crearSolicitud(repo(), actor, entrada);
  if (r.ok) revalidatePath('/solicitudes');
  return r;
}

export async function aprobarSolicitud(entrada: unknown): Promise<ResultadoAccion> {
  const actor = await verificarSesion();
  if (!actor) return { ok: false, error: 'No autenticado' };
  const r = await servicio.aprobarSolicitud(repo(), actor, entrada);
  if (r.ok) revalidatePath('/solicitudes');
  return r;
}

export async function rechazarSolicitud(entrada: unknown): Promise<ResultadoAccion> {
  const actor = await verificarSesion();
  if (!actor) return { ok: false, error: 'No autenticado' };
  const r = await servicio.rechazarSolicitud(repo(), actor, entrada);
  if (r.ok) revalidatePath('/solicitudes');
  return r;
}
