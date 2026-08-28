// Sesión 4 · Tema 8 — Fetch estructurado tras un repositorio: la costura (§8.1).
//
// La prueba de la afirmación de la clase: EL MISMO test de negocio corre contra la
// implementación en memoria y contra SQLite, sin cambiar una línea del servicio.
// Migrar de almacenamiento (o integrarse al core del banco) es implementar la
// interfaz Repositorio — no reescribir la aplicación.
import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { RepositorioSqlite } from '@/lib/repository.sqlite';
import type { Repositorio } from '@/lib/repository';
import { aprobarSolicitud, obtenerSolicitud } from '@/lib/solicitudes-service';
import { IDS, SUCURSAL_A, usuariosDemo, solicitudesDemo } from '@/lib/fixtures';
import type { Identidad } from '@/lib/types';

const APROBADOR_A: Identidad = {
  sesionId: 'sesion-demo', usuarioId: IDS.aprobadorA, rol: 'APROBADOR', sucursalId: SUCURSAL_A,
};
const ANALISTA_A: Identidad = {
  sesionId: 'sesion-demo', usuarioId: IDS.analistaA, rol: 'ANALISTA', sucursalId: SUCURSAL_A,
};

const directorioTemporal = mkdtempSync(join(tmpdir(), 'boveda-costura-'));
afterAll(() => rmSync(directorioTemporal, { recursive: true, force: true }));

// SQLite no recibe seed por constructor: se insertan las mismas fixtures por la interfaz.
async function sembrar(repo: Repositorio): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const s of solicitudesDemo()) {
    const { id: _ignorado, ...sinId } = s;
    const creada = await repo.crearSolicitud(sinId);
    ids.set(s.id, creada.id); // id de fixture → id real asignado por la implementación
  }
  return ids;
}

// Sembrar USUARIOS es tarea del seed (db/seed.ts), fuera de la interfaz Repositorio —
// aquí se replica ese paso con las mismas fixtures, igual que hace el runtime.
function sqliteConUsuarios(): Repositorio {
  const ruta = join(directorioTemporal, `costura-${crypto.randomUUID()}.db`);
  const repo = new RepositorioSqlite(ruta); // el constructor aplica db/schema.sql
  const db = new Database(ruta);
  const insertar = db.prepare(`INSERT INTO usuarios (id,usuario,nombre,rol,sucursalId,cedula,hashContrasena)
    VALUES (@id,@usuario,@nombre,@rol,@sucursalId,@cedula,@hashContrasena)`);
  for (const u of usuariosDemo()) insertar.run(u);
  db.close();
  return repo;
}

type Fabrica = () => Repositorio;
const implementaciones: Array<[string, Fabrica]> = [
  ['RepositorioMemoria', () => new RepositorioMemoria({ usuarios: usuariosDemo() })],
  ['RepositorioSqlite', sqliteConUsuarios],
];

describe.each(implementaciones)('la costura: mismo servicio sobre %s', (_nombre, fabrica) => {
  it('aprobación válida: cambia el estado y audita (idéntico en ambas)', async () => {
    const repo = fabrica();
    const ids = await sembrar(repo);
    const idPendienteA = ids.get(IDS.solicitudA)!;

    const r = await aprobarSolicitud(repo, APROBADOR_A, { id: idPendienteA });
    expect(r.ok).toBe(true);
    expect((await repo.buscarSolicitud(idPendienteA))?.estado).toBe('APROBADA');
    const bitacora = await repo.listarAuditoria();
    expect(bitacora.some((a) => a.evento === 'SOLICITUD_APROBADA')).toBe(true);
  });

  it('denegación con efecto verificado: PENDIENTE se queda PENDIENTE (idéntico en ambas)', async () => {
    const repo = fabrica();
    const ids = await sembrar(repo);
    const idPendienteA = ids.get(IDS.solicitudA)!;

    const r = await aprobarSolicitud(repo, ANALISTA_A, { id: idPendienteA });
    expect(r.ok).toBe(false);
    expect((await repo.buscarSolicitud(idPendienteA))?.estado).toBe('PENDIENTE');
  });

  it('anti-IDOR: la solicitud de otra sucursal es null (idéntico en ambas)', async () => {
    const repo = fabrica();
    const ids = await sembrar(repo);
    expect(await obtenerSolicitud(repo, ANALISTA_A, ids.get(IDS.solicitudB)!)).toBeNull();
  });
});
