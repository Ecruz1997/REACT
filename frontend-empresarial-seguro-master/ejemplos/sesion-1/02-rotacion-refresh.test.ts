// Sesión 1 · Tema 1 — Rotación de refresh con detección de reuso (§1.4, a fondo).
//
// El escenario completo de la clase, ejecutable:
// 1. Rotación normal: usar el refresh vigente emite uno nuevo; el anterior muere.
// 2. Robo detectado: presentar un refresh YA rotado revoca la sesión ENTERA
//    (recomendación de la OAuth 2.0 Security BCP, RFC 9700) y queda en bitácora.
import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { firmarRefreshToken, rotarRefresh } from '@/lib/refresh';
import type { SesionRegistro } from '@/lib/types';

const SECRETO = 'secreto-de-clase-suficientemente-largo';

let repo: RepositorioMemoria;
let sesion: SesionRegistro;

beforeEach(async () => {
  repo = new RepositorioMemoria();
  sesion = await repo.crearSesion('usuario-demo');
});

describe('rotación con detección de reuso (§1.4)', () => {
  it('rotación normal: el refresh vigente emite uno nuevo y deja de valer', async () => {
    const vigente = await firmarRefreshToken(sesion.id, sesion.refreshActual, SECRETO);

    const r1 = await rotarRefresh(repo, vigente, SECRETO);
    expect(r1.ok).toBe(true);

    // El anterior ya no es el vigente: usarlo de nuevo es "reuso".
    const r2 = await rotarRefresh(repo, vigente, SECRETO);
    expect(r2.ok).toBe(false);
  });

  it('reuso = robo: se revoca la sesión entera, no solo el token', async () => {
    // El usuario legítimo y el atacante tienen el MISMO refresh (fue robado).
    const robado = await firmarRefreshToken(sesion.id, sesion.refreshActual, SECRETO);

    // El legítimo lo usa primero: rotación normal.
    const legitimo = await rotarRefresh(repo, robado, SECRETO);
    expect(legitimo.ok).toBe(true);

    // El atacante presenta el viejo: se delata.
    const atacante = await rotarRefresh(repo, robado, SECRETO);
    expect(atacante.ok).toBe(false);
    if (!atacante.ok) expect(atacante.reuseDetectado).toBe(true);

    // Se cayó TODA la sesión: ni siquiera el refresh nuevo (del legítimo) sirve ya.
    const sesionDespues = await repo.buscarSesion(sesion.id);
    expect(sesionDespues?.revocadaEn).not.toBeNull();
    if (legitimo.ok) {
      const conElNuevo = await rotarRefresh(repo, legitimo.nuevoRefresh, SECRETO);
      expect(conElNuevo.ok).toBe(false);
    }
  });

  it('el reuso queda en la bitácora con su motivo', async () => {
    const robado = await firmarRefreshToken(sesion.id, sesion.refreshActual, SECRETO);
    await rotarRefresh(repo, robado, SECRETO); // rotación legítima
    await rotarRefresh(repo, robado, SECRETO); // reuso

    const bitacora = await repo.listarAuditoria();
    const evento = bitacora.find((a) => a.evento === 'ACCESO_DENEGADO');
    expect(evento).toBeDefined();
    expect(evento?.metadatos.motivo).toBe('reuso_de_refresh');
  });
});
