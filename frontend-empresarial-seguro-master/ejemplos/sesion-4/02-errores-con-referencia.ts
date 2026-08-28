// Sesión 4 · Tema 8 — Manejo centralizado de errores: referencia opaca (§8.4).
//
// El patrón del snippet de la sesión, como función reutilizable: el detalle del error
// va COMPLETO al log interno con una referencia; al cliente solo viaja la referencia.
// Soporte lo correlaciona con el log; el atacante no aprende nada de la infraestructura.
// (Bóveda no lo necesita en src/lib/ porque sus servicios devuelven ResultadoAccion
// sin lanzar; este es el envoltorio para integraciones que SÍ pueden explotar.)
import type { ResultadoAccion } from '@/lib/errors';

export interface RegistroInterno {
  ref: string;
  mensaje: string; // el detalle real: SOLO para el log del servidor
}

export async function conReferenciaOpaca<T>(
  operacion: () => Promise<T>,
  // El "logger" entra por parámetro (testeable); por defecto, la consola del servidor.
  registrar: (r: RegistroInterno) => void = (r) => console.error('[boveda]', r.ref, r.mensaje),
): Promise<ResultadoAccion<T>> {
  try {
    return { ok: true, datos: await operacion() };
  } catch (e) {
    const ref = crypto.randomUUID();
    registrar({ ref, mensaje: e instanceof Error ? e.message : String(e) });
    // Ni e.message, ni stack, ni nombre de tabla, ni versión de driver: solo la referencia.
    return { ok: false, error: `Ocurrió un error. Referencia: ${ref}` };
  }
}
