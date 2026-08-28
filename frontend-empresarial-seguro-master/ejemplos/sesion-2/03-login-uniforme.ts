// Sesión 2 · Tema 4 — Login estructurado con mensaje uniforme (§4.1), en su núcleo puro.
//
// La Server Action real (src/app/login/actions.ts) no se puede probar en unit porque
// lee cookies y redirige. Este módulo aísla la LÓGICA de la clase: validar → buscar →
// verificar hash → sesión nueva, devolviendo SIEMPRE el mismo error ante cualquier fallo.
// El verificador de hash entra por parámetro porque el real (src/lib/password.ts) es
// server-only; la práctica del patrón no depende de scrypt.
import type { Repositorio } from '@/lib/repository';
import type { Identidad } from '@/lib/types';
import type { ResultadoAccion } from '@/lib/errors';
import { EsquemaLogin } from '@/lib/schemas';

// UN solo mensaje para entrada malformada, usuario inexistente y contraseña incorrecta.
// Cualquier diferencia (texto, código de estado, tiempo) permite enumerar usuarios.
export const MENSAJE_UNIFORME = 'Usuario o contraseña incorrectos';

export async function autenticar(
  repo: Repositorio,
  entrada: unknown,
  verificarHash: (plano: string, almacenado: string) => boolean,
): Promise<ResultadoAccion<Identidad>> {
  const fallo = { ok: false as const, error: MENSAJE_UNIFORME };

  const parsed = EsquemaLogin.safeParse(entrada);
  if (!parsed.success) return fallo; // malformada: mismo mensaje

  const usuario = await repo.buscarUsuarioPorNombre(parsed.data.usuario);
  if (!usuario) return fallo; // inexistente: mismo mensaje (no "usuario no encontrado")

  if (!verificarHash(parsed.data.contrasena, usuario.hashContrasena)) {
    return fallo; // contraseña mala: mismo mensaje (no "contraseña incorrecta")
  }

  // Sesión NUEVA en cada login: el id de sesión nunca sobrevive a la autenticación
  // (previene fijación de sesión).
  const sesion = await repo.crearSesion(usuario.id);
  return {
    ok: true,
    datos: {
      sesionId: sesion.id,
      usuarioId: usuario.id,
      rol: usuario.rol,
      sucursalId: usuario.sucursalId,
    },
  };
}
