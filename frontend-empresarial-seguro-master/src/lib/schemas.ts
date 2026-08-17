// Validación en la frontera con Zod (Tema 3 / Tema 8: validación de entrada).
// El MISMO esquema alimenta el formulario del cliente (experiencia) y la Server Action (seguridad).
import { z } from 'zod';

// IBAN de Costa Rica: CR seguido de 20 dígitos.
const ibanCR = z
  .string()
  .regex(/^CR\d{20}$/, 'La cuenta destino debe ser un IBAN de Costa Rica válido');

export const EsquemaLogin = z.object({
  usuario: z.string().min(3, 'Usuario demasiado corto').max(64),
  contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(256),
});
export type DatosLogin = z.infer<typeof EsquemaLogin>;

export const EsquemaCrearSolicitud = z.object({
  cuentaDestino: ibanCR,
  monto: z.coerce
    .number()
    .positive('El monto debe ser positivo')
    .max(50_000_000, 'El monto excede el límite permitido'),
  moneda: z.enum(['CRC', 'USD']),
  justificacion: z
    .string()
    .min(20, 'La justificación debe tener al menos 20 caracteres')
    .max(1000, 'La justificación no puede exceder 1000 caracteres'),
});
// Entrada (antes de coerción, lo que produce el formulario) y salida (ya validada).
export type EntradaCrearSolicitud = z.input<typeof EsquemaCrearSolicitud>;
export type DatosCrearSolicitud = z.output<typeof EsquemaCrearSolicitud>;

export const EsquemaResolver = z.object({
  id: z.string().uuid('Identificador inválido'),
});
export type DatosResolver = z.infer<typeof EsquemaResolver>;
