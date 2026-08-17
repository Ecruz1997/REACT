// Rotación de refresh con detección de reuso (Tema 1, profundidad senior).
import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { firmarRefreshToken, rotarRefresh } from '@/lib/refresh';

const SECRETO = 'secreto-de-prueba-suficientemente-largo-123';
let repo: RepositorioMemoria;
let sesionId: string;
let refreshInicial: string;

beforeEach(async () => {
  repo = new RepositorioMemoria();
  const sesion = await repo.crearSesion('u-1');
  sesionId = sesion.id;
  refreshInicial = await firmarRefreshToken(sesion.id, sesion.refreshActual, SECRETO);
});

describe('rotación de refresh', () => {
  it('rotar con el refresh vigente emite uno nuevo', async () => {
    const r = await rotarRefresh(repo, refreshInicial, SECRETO);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.nuevoRefresh).not.toBe(refreshInicial);
  });

  it('el refresh anterior deja de ser válido tras rotar', async () => {
    await rotarRefresh(repo, refreshInicial, SECRETO); // rota una vez
    const segundoUso = await rotarRefresh(repo, refreshInicial, SECRETO); // reusa el viejo
    expect(segundoUso.ok).toBe(false);
    if (!segundoUso.ok) expect(segundoUso.reuseDetectado).toBe(true);
  });

  it('detectar reuso revoca la sesión entera', async () => {
    const r1 = await rotarRefresh(repo, refreshInicial, SECRETO);
    expect(r1.ok).toBe(true);
    // el atacante presenta el refresh robado (el inicial, ya rotado)
    await rotarRefresh(repo, refreshInicial, SECRETO);
    // la sesión quedó revocada: ni siquiera el refresh legítimo nuevo sirve
    const nuevo = r1.ok ? r1.nuevoRefresh : '';
    const trasRevocar = await rotarRefresh(repo, nuevo, SECRETO);
    expect(trasRevocar.ok).toBe(false);
    const sesion = await repo.buscarSesion(sesionId);
    expect(sesion?.revocadaEn).not.toBeNull();
  });

  it('el reuso queda registrado en la bitácora', async () => {
    await rotarRefresh(repo, refreshInicial, SECRETO);
    await rotarRefresh(repo, refreshInicial, SECRETO); // reuso
    const auditoria = await repo.listarAuditoria();
    expect(auditoria.some((a) => a.metadatos.motivo === 'reuso_de_refresh')).toBe(true);
  });

  it('un refresh con firma inválida se rechaza sin revocar', async () => {
    const r = await rotarRefresh(repo, refreshInicial.slice(0, -3) + 'xxx', SECRETO);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reuseDetectado).toBe(false);
  });
});
