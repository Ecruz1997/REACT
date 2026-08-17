import 'server-only';
import { scryptSync, timingSafeEqual } from 'node:crypto';

// Verificación en tiempo constante para no filtrar información por diferencia de tiempo.
export function verificarContrasena(plano: string, almacenado: string): boolean {
  const [salt, hashHex] = almacenado.split(':');
  if (!salt || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const derivado = scryptSync(plano, salt, esperado.length);
  return esperado.length === derivado.length && timingSafeEqual(esperado, derivado);
}
