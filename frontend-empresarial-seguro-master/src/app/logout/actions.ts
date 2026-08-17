'use server';
import { redirect } from 'next/navigation';
import { destruirSesion, verificarSesion } from '@/lib/session';
import { repo } from '@/lib/db';

export async function cerrarSesion() {
  const actor = await verificarSesion();
  if (actor) {
    await repo().registrarAuditoria({
      evento: 'CIERRE_SESION', actorId: actor.usuarioId,
      ocurridoEn: new Date().toISOString(), metadatos: {},
    });
  }
  await destruirSesion();
  redirect('/login');
}
