'use server';

import { redirect } from 'next/navigation';
import { repo } from '@/lib/db';
import { EsquemaLogin } from '@/lib/schemas';
import { verificarContrasena } from '@/lib/password';
import { establecerSesion } from '@/lib/session';
import type { ResultadoAccion } from '@/lib/errors';

export async function iniciarSesion(_prev: unknown, formData: FormData): Promise<ResultadoAccion> {
  const parsed = EsquemaLogin.safeParse(Object.fromEntries(formData));
  // Mensaje uniforme ante cualquier fallo: no revela si el usuario existe.
  const fallo = { ok: false as const, error: 'Usuario o contraseña incorrectos' };
  if (!parsed.success) return fallo;

  const usuario = await repo().buscarUsuarioPorNombre(parsed.data.usuario);
  if (!usuario) return fallo;
  if (!verificarContrasena(parsed.data.contrasena, usuario.hashContrasena)) {
    await repo().registrarAuditoria({
      evento: 'LOGIN_FALLIDO', actorId: usuario.id,
      ocurridoEn: new Date().toISOString(), metadatos: { usuario: parsed.data.usuario },
    });
    return fallo;
  }

  // Rotación: sesión NUEVA en cada login (previene fijación de sesión).
  const sesion = await repo().crearSesion(usuario.id);
  await establecerSesion({
    sesionId: sesion.id, usuarioId: usuario.id, rol: usuario.rol, sucursalId: usuario.sucursalId,
  });
  await repo().registrarAuditoria({
    evento: 'LOGIN_EXITOSO', actorId: usuario.id,
    ocurridoEn: new Date().toISOString(), metadatos: {},
  });

  redirect('/solicitudes');
}
