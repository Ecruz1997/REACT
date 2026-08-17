// Enmascaramiento y minimización de datos sensibles (Tema 9).
// Se aplica en el SERVIDOR: el valor completo nunca debe llegar al navegador.

export function enmascararCuenta(iban: string): string {
  if (iban.length < 4) return '••••';
  return `•••• ${iban.slice(-4)}`;
}

export function enmascararCedula(cedula: string): string {
  if (cedula.length < 4) return '•••';
  return `${cedula.slice(0, 1)}-••••-${cedula.slice(-3)}`;
}

// Proyección mínima de una solicitud para listados: nunca envía la cuenta completa.
import type { Solicitud } from './types';

export interface SolicitudListado {
  id: string;
  cuentaEnmascarada: string;
  monto: number;
  moneda: string;
  estado: string;
  creadaEn: string;
}

export function aListado(s: Solicitud): SolicitudListado {
  return {
    id: s.id,
    cuentaEnmascarada: enmascararCuenta(s.cuentaDestino),
    monto: s.monto,
    moneda: s.moneda,
    estado: s.estado,
    creadaEn: s.creadaEn,
  };
}
