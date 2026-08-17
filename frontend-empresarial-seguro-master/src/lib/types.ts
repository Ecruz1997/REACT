// Tipos de dominio de Bóveda. Sin dependencias de Next: se pueden probar en aislamiento.

export type Rol = 'ANALISTA' | 'APROBADOR' | 'AUDITOR';

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';

export interface Usuario {
  id: string;
  usuario: string;
  nombre: string;
  rol: Rol;
  sucursalId: string;
  cedula: string;
  // hash de contraseña; nunca se serializa al cliente
  hashContrasena: string;
}

export interface Solicitud {
  id: string;
  sucursalId: string;
  creadaPor: string;
  cuentaDestino: string;
  monto: number;
  moneda: 'CRC' | 'USD';
  justificacion: string;
  estado: EstadoSolicitud;
  creadaEn: string;
  resueltaPor: string | null;
  resueltaEn: string | null;
}

export interface SesionRegistro {
  id: string;
  usuarioId: string;
  creadaEn: string;
  ultimoAccesoEn: string;
  revocadaEn: string | null;
  refreshActual: string; // id del refresh token vigente (para rotación con detección de reuso)
}

// Identidad que viaja dentro del token, ya verificada.
export interface Identidad {
  sesionId: string;
  usuarioId: string;
  rol: Rol;
  sucursalId: string;
}

export type EventoAuditoria =
  | 'LOGIN_EXITOSO'
  | 'LOGIN_FALLIDO'
  | 'CIERRE_SESION'
  | 'SOLICITUD_CREADA'
  | 'SOLICITUD_APROBADA'
  | 'SOLICITUD_RECHAZADA'
  | 'ACCESO_DENEGADO';

export interface RegistroAuditoria {
  id: string;
  evento: EventoAuditoria;
  actorId: string;
  ocurridoEn: string;
  metadatos: Record<string, string | number>;
}
