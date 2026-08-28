// Tests BASE de la Práctica 3 (lo ofertado — obligatorios).
//
// Cubren los cuatro puntos que la rúbrica declara como base de los Temas 7–8:
//   1. validación de sesión en servidor por render
//   2. ninguna ruta autenticada estática
//   3. acceso a datos solo tras la interfaz de repositorio
//   4. ResultadoAccion uniforme, sin filtrar detalle interno
//
// Los tres primeros son *fitness functions de arquitectura*: no ejercitan una función,
// verifican una PROPIEDAD del código. Es la forma honesta de probar "no existe un
// componente que hable con la base": no hay nada que llamar, hay algo que no debe estar.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { aprobarSolicitud, obtenerSolicitud } from '@/lib/solicitudes-service';
import { IDS, SUCURSAL_A, SUCURSAL_B, usuariosDemo, solicitudesDemo } from '@/lib/fixtures';
import type { Identidad } from '@/lib/types';

const RAIZ = process.cwd();
const leer = (rel: string) => readFileSync(join(RAIZ, rel), 'utf8');

function archivosBajo(dir: string, ext: string[]): string[] {
  const salida: string[] = [];
  const caminar = (d: string) => {
    for (const e of readdirSync(join(RAIZ, d))) {
      const rel = `${d}/${e}`;
      if (statSync(join(RAIZ, rel)).isDirectory()) caminar(rel);
      else if (ext.some((x) => e.endsWith(x))) salida.push(rel);
    }
  };
  caminar(dir);
  return salida;
}

// Páginas que RENDERIZAN datos del usuario: son las que no pueden cachearse jamás.
const PAGINAS_CON_DATOS = [
  'src/app/solicitudes/page.tsx',
  'src/app/solicitudes/[id]/page.tsx',
  'src/app/auditoria/page.tsx',
];
// Páginas públicas: no leen sesión, pueden ser estáticas sin problema.
const PAGINAS_PUBLICAS = ['src/app/login/page.tsx', 'src/app/no-autorizado/page.tsx'];

describe('1 · Validación de sesión en servidor, por render', () => {
  it.each(PAGINAS_CON_DATOS)('%s valida la sesión antes de renderizar', (ruta) => {
    const src = leer(ruta);
    expect(src).toContain('verificarSesion()');
    // y ante la ausencia de actor, corta: no sigue hacia los datos
    expect(src).toMatch(/if \(!actor\)\s*redirect\('\/login'\)/);
  });

  it('la raíz decide el destino con la sesión y no renderiza datos', () => {
    const src = leer('src/app/page.tsx');
    expect(src).toContain('verificarSesion()');
    expect(src).toContain('redirect(');
    // Si algún día esta página empieza a mostrar datos, este test lo delata:
    // pasaría a necesitar force-dynamic explícito como las demás.
    expect(src).not.toContain('repo()');
  });
});

describe('2 · Ninguna ruta autenticada puede ser estática', () => {
  it.each(PAGINAS_CON_DATOS)('%s declara force-dynamic explícito', (ruta) => {
    expect(leer(ruta)).toMatch(/export const dynamic = 'force-dynamic'/);
  });

  it('las páginas públicas no lo declaran (no hay datos por usuario que proteger)', () => {
    for (const ruta of PAGINAS_PUBLICAS) {
      expect(leer(ruta)).not.toContain('force-dynamic');
    }
  });
});

describe('3 · El acceso a datos pasa solo por el repositorio', () => {
  const bajoApp = [...archivosBajo('src/app', ['.ts', '.tsx']), ...archivosBajo('src/components', ['.ts', '.tsx'])];

  it('ningún componente ni página importa el driver de base', () => {
    const fugas = bajoApp.filter((f) => /better-sqlite3|repository\.sqlite/.test(leer(f)));
    expect(fugas, `estos archivos hablan con la base directo: ${fugas.join(', ')}`).toEqual([]);
  });

  it('ningún componente ni página arma SQL a mano', () => {
    const fugas = bajoApp.filter((f) => /\b(SELECT|INSERT INTO|UPDATE .* SET|DELETE FROM)\b/.test(leer(f)));
    expect(fugas, `estos archivos arman SQL: ${fugas.join(', ')}`).toEqual([]);
  });

  it('el servicio recibe el repositorio por parámetro, no lo importa', () => {
    const src = leer('src/lib/solicitudes-service.ts');
    expect(src).not.toMatch(/from '\.\/db'/);
    expect(src).toMatch(/repo: Repositorio/);
  });
});

describe('4 · ResultadoAccion uniforme, sin filtrar detalle interno', () => {
  const identidad = (usuarioId: string, rol: Identidad['rol'], sucursalId: string): Identidad => ({
    sesionId: 'sesion-test',
    usuarioId,
    rol,
    sucursalId,
  });
  const nuevoRepo = () =>
    new RepositorioMemoria({ usuarios: usuariosDemo(), solicitudes: solicitudesDemo() });

  it('una denegación devuelve { ok: false, error } y NO lanza', async () => {
    const repo = nuevoRepo();
    const analista = identidad(IDS.analistaA, 'ANALISTA', SUCURSAL_A);
    const r = await aprobarSolicitud(repo, analista, { id: IDS.solicitudA });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(typeof r.error).toBe('string');
  });

  it('una entrada basura se rechaza sin lanzar y sin detalle del validador', async () => {
    const repo = nuevoRepo();
    const aprobador = identidad(IDS.aprobadorA, 'APROBADOR', SUCURSAL_A);
    const r = await aprobarSolicitud(repo, aprobador, { id: 'no-es-un-uuid' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      // ni rutas del sistema, ni SQL, ni stack, ni nombres de tabla
      expect(r.error).not.toMatch(/\/home\/|\.ts:|SQLITE|SELECT |at Object\.|node_modules/);
    }
  });

  it('el mensaje de una solicitud ajena no revela que existe', async () => {
    const repo = nuevoRepo();
    const aprobador = identidad(IDS.aprobadorA, 'APROBADOR', SUCURSAL_A);
    const ajena = await aprobarSolicitud(repo, aprobador, { id: IDS.solicitudB });
    const inexistente = await aprobarSolicitud(repo, aprobador, {
      id: '00000000-0000-4000-8000-000000000000',
    });
    expect(ajena.ok).toBe(false);
    expect(inexistente.ok).toBe(false);
    // el DAL devuelve null en ambos casos: ajeno e inexistente son indistinguibles
    const vistaAjena = await obtenerSolicitud(repo, identidad(IDS.analistaA, 'ANALISTA', SUCURSAL_A), IDS.solicitudB);
    const vistaInexistente = await obtenerSolicitud(
      repo,
      identidad(IDS.analistaA, 'ANALISTA', SUCURSAL_A),
      '00000000-0000-4000-8000-000000000000',
    );
    expect(vistaAjena).toBeNull();
    expect(vistaInexistente).toBeNull();
    expect(SUCURSAL_B).not.toBe(SUCURSAL_A); // la ajena es de otra sucursal, por construcción
  });

  it('error.tsx nunca renderiza error.message', () => {
    const src = leer('src/app/error.tsx');
    expect(src).not.toMatch(/error\.message|\{\s*message\s*\}/);
  });
});
