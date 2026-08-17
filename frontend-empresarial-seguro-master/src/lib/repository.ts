// Interfaz del repositorio (Tema 5 / Tema 10: separación cliente-servidor, estructura escalable).
//
// El repositorio es la COSTURA del sistema. La misma interfaz tiene dos implementaciones:
//   - RepositorioMemoria: para los tests (rápido, aislado, sin dependencias nativas)
//   - RepositorioSqlite:   para runtime (persistencia real)
// En un port real, una tercera implementación hablaría con el core del banco SIN que
// cambien las Server Actions ni los componentes. Esa es la pieza que hace viable el port.
import type {
  Usuario,
  Solicitud,
  SesionRegistro,
  RegistroAuditoria,
} from './types';

export interface Repositorio {
  // Usuarios
  buscarUsuarioPorNombre(usuario: string): Promise<Usuario | null>;
  buscarUsuarioPorId(id: string): Promise<Usuario | null>;

  // Sesiones
  crearSesion(usuarioId: string): Promise<SesionRegistro>;
  buscarSesion(id: string): Promise<SesionRegistro | null>;
  tocarSesion(id: string): Promise<void>; // actualiza ultimoAccesoEn
  revocarSesion(id: string): Promise<void>;
  rotarRefresh(sesionId: string, nuevoRefreshId: string): Promise<void>;

  // Solicitudes
  listarSolicitudes(filtro: { sucursalId?: string }): Promise<Solicitud[]>;
  buscarSolicitud(id: string): Promise<Solicitud | null>;
  crearSolicitud(s: Omit<Solicitud, 'id'>): Promise<Solicitud>;
  actualizarSolicitud(id: string, cambios: Partial<Solicitud>): Promise<Solicitud>;

  // Auditoría (append-only)
  registrarAuditoria(r: Omit<RegistroAuditoria, 'id'>): Promise<void>;
  listarAuditoria(): Promise<RegistroAuditoria[]>;
}
