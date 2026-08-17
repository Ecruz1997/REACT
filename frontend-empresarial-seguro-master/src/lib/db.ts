import 'server-only';
import { join } from 'node:path';
import { RepositorioSqlite } from './repository.sqlite';
import type { Repositorio } from './repository';

// Singleton del repositorio para el runtime de Next.
let instancia: Repositorio | null = null;

export function repo(): Repositorio {
  if (!instancia) {
    const ruta = process.env.BOVEDA_DB ?? join(process.cwd(), 'boveda.db');
    instancia = new RepositorioSqlite(ruta);
  }
  return instancia;
}
