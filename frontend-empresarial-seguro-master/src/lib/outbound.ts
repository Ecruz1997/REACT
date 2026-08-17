// Salida segura de fetch desde el servidor (Tema 8, profundidad senior).
// Un Server Component o Server Action que hace fetch a una URL influida por el usuario
// es un vector de SSRF: puede alcanzar servicios internos (169.254.169.254, 10.x, localhost).
// Este módulo valida el destino contra una allowlist y bloquea destinos internos.

const HOSTS_PERMITIDOS = new Set<string>([
  'api.core.bancocr.fi.cr', // ejemplo: el core empresarial
]);

// Rangos privados / de enlace-local / loopback que nunca deben alcanzarse desde el servidor.
function esHostInterno(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  // IPv4 literal
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127) return true;                 // loopback
    if (a === 10) return true;                  // privado
    if (a === 192 && b === 168) return true;    // privado
    if (a === 172 && b >= 16 && b <= 31) return true; // privado
    if (a === 169 && b === 254) return true;    // link-local (metadata cloud)
    if (a === 0) return true;
  }
  if (host === '::1' || host === '[::1]') return true; // loopback IPv6
  return false;
}

export type ResultadoDestino =
  | { permitido: true; url: URL }
  | { permitido: false; motivo: string };

export function validarDestino(entrada: string): ResultadoDestino {
  let url: URL;
  try { url = new URL(entrada); } catch { return { permitido: false, motivo: 'URL inválida' }; }
  if (url.protocol !== 'https:') return { permitido: false, motivo: 'Solo se permite https' };
  if (esHostInterno(url.hostname)) return { permitido: false, motivo: 'Destino interno bloqueado (SSRF)' };
  if (!HOSTS_PERMITIDOS.has(url.hostname)) return { permitido: false, motivo: 'Host no está en la allowlist' };
  return { permitido: true, url };
}

// Envoltura de fetch que solo procede si el destino pasa la validación.
export async function fetchSeguro(entrada: string, init?: RequestInit): Promise<Response> {
  const r = validarDestino(entrada);
  if (!r.permitido) throw new Error(`fetch bloqueado: ${r.motivo}`);
  return fetch(r.url, { ...init, redirect: 'error' }); // 'error': un redirect no puede saltar la allowlist
}
