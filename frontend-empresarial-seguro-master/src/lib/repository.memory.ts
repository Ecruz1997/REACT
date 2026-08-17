// Implementación en memoria del repositorio. Usada por los tests unitarios.
import { randomUUID } from 'node:crypto';
import type { Repositorio } from './repository';
import type {
  Usuario,
  Solicitud,
  SesionRegistro,
  RegistroAuditoria,
} from './types';

export class RepositorioMemoria implements Repositorio {
  private usuarios = new Map<string, Usuario>();
  private sesiones = new Map<string, SesionRegistro>();
  private solicitudes = new Map<string, Solicitud>();
  private auditoria: RegistroAuditoria[] = [];

  constructor(seed?: { usuarios?: Usuario[]; solicitudes?: Solicitud[] }) {
    seed?.usuarios?.forEach((u) => this.usuarios.set(u.id, u));
    seed?.solicitudes?.forEach((s) => this.solicitudes.set(s.id, s));
  }

  async buscarUsuarioPorNombre(usuario: string): Promise<Usuario | null> {
    for (const u of this.usuarios.values()) if (u.usuario === usuario) return u;
    return null;
  }
  async buscarUsuarioPorId(id: string): Promise<Usuario | null> {
    return this.usuarios.get(id) ?? null;
  }

  async crearSesion(usuarioId: string): Promise<SesionRegistro> {
    const ahora = new Date().toISOString();
    const sesion: SesionRegistro = {
      id: randomUUID(),
      usuarioId,
      creadaEn: ahora,
      ultimoAccesoEn: ahora,
      revocadaEn: null,
      refreshActual: randomUUID(),
    };
    this.sesiones.set(sesion.id, sesion);
    return sesion;
  }
  async buscarSesion(id: string): Promise<SesionRegistro | null> {
    return this.sesiones.get(id) ?? null;
  }
  async tocarSesion(id: string): Promise<void> {
    const s = this.sesiones.get(id);
    if (s) s.ultimoAccesoEn = new Date().toISOString();
  }
  async revocarSesion(id: string): Promise<void> {
    const s = this.sesiones.get(id);
    if (s) s.revocadaEn = new Date().toISOString();
  }
  async rotarRefresh(sesionId: string, nuevoRefreshId: string): Promise<void> {
    const s = this.sesiones.get(sesionId);
    if (s) s.refreshActual = nuevoRefreshId;
  }

  async listarSolicitudes(filtro: { sucursalId?: string }): Promise<Solicitud[]> {
    const todas = [...this.solicitudes.values()];
    const filtradas = filtro.sucursalId
      ? todas.filter((s) => s.sucursalId === filtro.sucursalId)
      : todas;
    return filtradas.sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
  }
  async buscarSolicitud(id: string): Promise<Solicitud | null> {
    return this.solicitudes.get(id) ?? null;
  }
  async crearSolicitud(s: Omit<Solicitud, 'id'>): Promise<Solicitud> {
    const solicitud: Solicitud = { ...s, id: randomUUID() };
    this.solicitudes.set(solicitud.id, solicitud);
    return solicitud;
  }
  async actualizarSolicitud(id: string, cambios: Partial<Solicitud>): Promise<Solicitud> {
    const actual = this.solicitudes.get(id);
    if (!actual) throw new Error('Solicitud no encontrada');
    const actualizada = { ...actual, ...cambios };
    this.solicitudes.set(id, actualizada);
    return actualizada;
  }

  async registrarAuditoria(r: Omit<RegistroAuditoria, 'id'>): Promise<void> {
    this.auditoria.push({ ...r, id: randomUUID() });
  }
  async listarAuditoria(): Promise<RegistroAuditoria[]> {
    return [...this.auditoria].sort((a, b) => b.ocurridoEn.localeCompare(a.ocurridoEn));
  }
}
