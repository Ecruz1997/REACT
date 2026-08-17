// Cifrado a nivel de campo (Tema 9, profundidad senior).
// Para datos que deben estar cifrados EN REPOSO además de enmascarados en pantalla
// (p. ej. la cuenta destino completa). AES-256-GCM: cifra y autentica a la vez —
// si el ciphertext se altera, el descifrado falla en lugar de devolver basura.
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const ALG = 'aes-256-gcm';

function clave(secreto: string): Buffer {
  // Deriva una clave de 32 bytes del secreto. En producción: KMS/HSM, no una env.
  return createHash('sha256').update(secreto).digest();
}

// Formato de salida: iv.tag.ciphertext (todo en base64url), autocontenido.
export function cifrarCampo(plano: string, secreto: string): string {
  const iv = randomBytes(12); // 96 bits, recomendado para GCM
  const cipher = createCipheriv(ALG, clave(secreto), iv);
  const ct = Buffer.concat([cipher.update(plano, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString('base64url')).join('.');
}

export function descifrarCampo(cifrado: string, secreto: string): string {
  const [ivB64, tagB64, ctB64] = cifrado.split('.');
  if (!ivB64 || !tagB64 || !ctB64) throw new Error('Formato de campo cifrado inválido');
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const ct = Buffer.from(ctB64, 'base64url');
  const decipher = createDecipheriv(ALG, clave(secreto), iv);
  decipher.setAuthTag(tag); // si el ciphertext o el tag fueron alterados, final() lanza
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

// Tokenización: reemplaza un valor sensible por un token determinista y sin sentido.
// Útil para buscar/agrupar sin exponer el valor (no reversible sin la tabla de tokens).
export function tokenizar(valor: string, secreto: string): string {
  return createHash('sha256').update(`${secreto}:${valor}`).digest('base64url').slice(0, 24);
}
