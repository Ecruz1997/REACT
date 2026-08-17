// Sanitización de HTML enriquecido (Tema 3).
//
// Matiz importante (corregido respecto a una versión anterior del material):
// - El ESCAPADO de salida según contexto es la defensa primaria y ocurre al renderizar;
//   React ya escapa por defecto todo lo interpolado en JSX.
// - La SANITIZACIÓN de HTML enriquecido (cuando un campo admite formato) se hace al
//   ESCRIBIR, para que el dato limpio proteja a todos los consumidores (web, PDF, móvil),
//   no solo a la vista actual.
// Ambos momentos coexisten; no se sustituyen.
import DOMPurify from 'isomorphic-dompurify';

const CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: [] as string[],
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'svg'],
};

export function sanitizarHtml(sucio: string): string {
  return DOMPurify.sanitize(sucio, CONFIG);
}

// Validación de esquema de URL para href/src (React no valida esquemas).
const ESQUEMAS_PERMITIDOS = ['http:', 'https:', 'mailto:'];

export function enlaceSeguro(entrada: string, base = 'https://boveda.interno'): string | null {
  try {
    const url = new URL(entrada, base);
    return ESQUEMAS_PERMITIDOS.includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}
