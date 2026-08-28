// Sesión 2 · Tema 3 — Trusted Types: bloquear el sink, no perseguir cada fuente (§3.3).
//
// Typecheck-only: Trusted Types es un API del NAVEGADOR (se ejercita en la demo en vivo
// de la clase con la consola de Chrome). Con la cabecera activa, cualquier
// `elemento.innerHTML = stringCrudo` LANZA en runtime en toda la app; solo se aceptan
// valores que pasaron por una política registrada. Es la misma idea del DAL —
// "convertir convención en restricción" — aplicada al DOM.
import { sanitizarHtml } from '@/lib/sanitize';

// La cabecera que enciende la restricción (se agrega a la CSP del middleware):
export const DIRECTIVA_TRUSTED_TYPES =
  "require-trusted-types-for 'script'; trusted-types boveda-sanitizer";

// La forma del API (lib.dom de esta versión de TS aún no lo trae; el paquete oficial
// de tipos es @types/trusted-types — aquí se declara lo mínimo para el ejemplo):
interface PoliticaTrustedTypes {
  createHTML(entrada: string): { toString(): string }; // TrustedHTML: valor opaco
}
interface FabricaTrustedTypes {
  createPolicy(
    nombre: string,
    reglas: { createHTML?: (entrada: string) => string },
  ): PoliticaTrustedTypes;
}
declare global {
  interface Window {
    trustedTypes?: FabricaTrustedTypes;
  }
}

// La única puerta legítima hacia innerHTML: una política con nombre, auditable.
// Devuelve null en el servidor o en navegadores sin soporte (la CSP sigue protegiendo).
export function crearPoliticaSanitizadora(): PoliticaTrustedTypes | null {
  if (typeof window === 'undefined' || !window.trustedTypes) return null;
  return window.trustedTypes.createPolicy('boveda-sanitizer', {
    // Todo HTML que entra al DOM pasa por el MISMO sanitizador que usa el servidor.
    createHTML: (entrada: string) => sanitizarHtml(entrada),
  });
}

// Uso (en un Client Component, si de verdad hiciera falta innerHTML):
//   const politica = crearPoliticaSanitizadora();
//   elemento.innerHTML = politica ? politica.createHTML(datoExterno) : '';
// Un `elemento.innerHTML = datoExterno` olvidado, sin política, lanza — el default
// quedó invertido: lo inseguro ya no compila... corre, pero explota de inmediato y
// en pruebas, no en producción ante el primer payload real.
