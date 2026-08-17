// Implementación SQLite del repositorio (runtime). Misma interfaz que la de memoria.
// Demuestra la costura: cambiar de almacenamiento no toca servicios ni componentes.
import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Repositorio } from './repository';
import type { Usuario, Solicitud, SesionRegistro, RegistroAuditoria } from './types';

export class RepositorioSqlite implements Repositorio {
  private db: Database.Database;

  constructor(rutaArchivo: string) {
    this.db = new Database(rutaArchivo);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    const schema = readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf-8');
    this.db.exec(schema);
  }

  async buscarUsuarioPorNombre(usuario: string): Promise<Usuario | null> {
    return (this.db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get(usuario) as Usuario) ?? null;
  }
  async buscarUsuarioPorId(id: string): Promise<Usuario | null> {
    return (this.db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id) as Usuario) ?? null;
  }

  async crearSesion(usuarioId: string): Promise<SesionRegistro> {
    const ahora = new Date().toISOString();
    const sesion: SesionRegistro = { id: randomUUID(), usuarioId, creadaEn: ahora, ultimoAccesoEn: ahora, revocadaEn: null, refreshActual: randomUUID() };
    this.db.prepare('INSERT INTO sesiones (id,usuarioId,creadaEn,ultimoAccesoEn,revocadaEn,refreshActual) VALUES (?,?,?,?,?,?)')
      .run(sesion.id, sesion.usuarioId, sesion.creadaEn, sesion.ultimoAccesoEn, sesion.revocadaEn, sesion.refreshActual);
    return sesion;
  }
  async buscarSesion(id: string): Promise<SesionRegistro | null> {
    return (this.db.prepare('SELECT * FROM sesiones WHERE id = ?').get(id) as SesionRegistro) ?? null;
  }
  async tocarSesion(id: string): Promise<void> {
    this.db.prepare('UPDATE sesiones SET ultimoAccesoEn = ? WHERE id = ?').run(new Date().toISOString(), id);
  }
  async revocarSesion(id: string): Promise<void> {
    this.db.prepare('UPDATE sesiones SET revocadaEn = ? WHERE id = ?').run(new Date().toISOString(), id);
  }
  async rotarRefresh(sesionId: string, nuevoRefreshId: string): Promise<void> {
    this.db.prepare('UPDATE sesiones SET refreshActual = ? WHERE id = ?').run(nuevoRefreshId, sesionId);
  }

  async listarSolicitudes(filtro: { sucursalId?: string }): Promise<Solicitud[]> {
    if (filtro.sucursalId) {
      return this.db.prepare('SELECT * FROM solicitudes WHERE sucursalId = ? ORDER BY creadaEn DESC').all(filtro.sucursalId) as Solicitud[];
    }
    return this.db.prepare('SELECT * FROM solicitudes ORDER BY creadaEn DESC').all() as Solicitud[];
  }
  async buscarSolicitud(id: string): Promise<Solicitud | null> {
    return (this.db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(id) as Solicitud) ?? null;
  }
  async crearSolicitud(s: Omit<Solicitud, 'id'>): Promise<Solicitud> {
    const solicitud: Solicitud = { ...s, id: randomUUID() };
    this.db.prepare(`INSERT INTO solicitudes
      (id,sucursalId,creadaPor,cuentaDestino,monto,moneda,justificacion,estado,creadaEn,resueltaPor,resueltaEn)
      VALUES (@id,@sucursalId,@creadaPor,@cuentaDestino,@monto,@moneda,@justificacion,@estado,@creadaEn,@resueltaPor,@resueltaEn)`)
      .run(solicitud);
    return solicitud;
  }
  async actualizarSolicitud(id: string, cambios: Partial<Solicitud>): Promise<Solicitud> {
    const actual = await this.buscarSolicitud(id);
    if (!actual) throw new Error('Solicitud no encontrada');
    const next = { ...actual, ...cambios };
    this.db.prepare('UPDATE solicitudes SET estado=@estado, resueltaPor=@resueltaPor, resueltaEn=@resueltaEn WHERE id=@id').run(next);
    return next;
  }

  async registrarAuditoria(r: Omit<RegistroAuditoria, 'id'>): Promise<void> {
    this.db.prepare('INSERT INTO auditoria (id,evento,actorId,ocurridoEn,metadatos) VALUES (?,?,?,?,?)')
      .run(randomUUID(), r.evento, r.actorId, r.ocurridoEn, JSON.stringify(r.metadatos));
  }
  async listarAuditoria(): Promise<RegistroAuditoria[]> {
    const filas = this.db.prepare('SELECT * FROM auditoria ORDER BY ocurridoEn DESC').all() as Array<Omit<RegistroAuditoria, 'metadatos'> & { metadatos: string }>;
    return filas.map((f) => ({ ...f, metadatos: JSON.parse(f.metadatos) }));
  }
}
