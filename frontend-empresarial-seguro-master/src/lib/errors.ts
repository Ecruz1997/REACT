// Errores de dominio. Separan "no autenticado" de "no autorizado" en el servidor,
// pero hacia el cliente ambos deben verse iguales cuando revelar la diferencia filtra información.

export class ErrorNoAutenticado extends Error {
  constructor() {
    super('No autenticado');
    this.name = 'ErrorNoAutenticado';
  }
}

export class ErrorNoAutorizado extends Error {
  constructor() {
    super('No autorizado');
    this.name = 'ErrorNoAutorizado';
  }
}

// Resultado uniforme de una Server Action. Nunca lanza hacia el cliente.
export type ResultadoAccion<T = void> =
  | { ok: true; datos?: T }
  | { ok: false; error: string };
