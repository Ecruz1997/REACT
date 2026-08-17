// Puebla la base SQLite con usuarios y solicitudes de demo.
// Contraseña de todos: "Demo1234"
import { scryptSync, randomBytes } from 'node:crypto';
import Database from 'better-sqlite3';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { usuariosDemo, solicitudesDemo } from '../src/lib/fixtures.js';

export function hashContrasena(plano: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivado = scryptSync(plano, salt, 64).toString('hex');
  return `${salt}:${derivado}`;
}

const ruta = process.env.BOVEDA_DB ?? join(process.cwd(), 'boveda.db');
const db = new Database(ruta);
db.exec(readFileSync(join(process.cwd(), 'db', 'schema.sql'), 'utf-8'));

// Limpiar para reejecución idempotente
db.exec('DELETE FROM auditoria; DELETE FROM solicitudes; DELETE FROM sesiones; DELETE FROM usuarios;');

const hash = hashContrasena('Demo1234');
const insUsuario = db.prepare(`INSERT INTO usuarios (id,usuario,nombre,rol,sucursalId,cedula,hashContrasena)
  VALUES (@id,@usuario,@nombre,@rol,@sucursalId,@cedula,@hashContrasena)`);
for (const u of usuariosDemo(hash)) insUsuario.run(u);

const insSol = db.prepare(`INSERT INTO solicitudes
  (id,sucursalId,creadaPor,cuentaDestino,monto,moneda,justificacion,estado,creadaEn,resueltaPor,resueltaEn)
  VALUES (@id,@sucursalId,@creadaPor,@cuentaDestino,@monto,@moneda,@justificacion,@estado,@creadaEn,@resueltaPor,@resueltaEn)`);
for (const s of solicitudesDemo()) insSol.run(s);

console.log(`Seed completo en ${ruta}`);
console.log('Usuarios: ana.analista, beto.aprobador, carla.aprobadora, dina.auditora, edu.heredia');
console.log('Contraseña de todos: Demo1234');
db.close();
