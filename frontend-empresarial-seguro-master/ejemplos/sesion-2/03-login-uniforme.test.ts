// Sesión 2 · Tema 4 — El punto 2 de la prueba de aceptación de la Práctica 1:
// "usuario inexistente vs contraseña mala → EXACTAMENTE el mismo mensaje".
import { describe, it, expect, beforeEach } from 'vitest';
import { RepositorioMemoria } from '@/lib/repository.memory';
import { usuariosDemo } from '@/lib/fixtures';
import { autenticar, MENSAJE_UNIFORME } from './03-login-uniforme';

// Verificador de hash de juguete para el ejemplo: almacenado = "hash:<contraseña>".
// El real (scrypt + timingSafeEqual) vive en src/lib/password.ts.
const verificarHash = (plano: string, almacenado: string) => almacenado === `hash:${plano}`;

let repo: RepositorioMemoria;
beforeEach(() => {
  repo = new RepositorioMemoria({ usuarios: usuariosDemo('hash:Demo1234') });
});

describe('login con mensaje uniforme (§4.1)', () => {
  it('usuario inexistente y contraseña mala devuelven EXACTAMENTE el mismo error', async () => {
    const inexistente = await autenticar(repo, { usuario: 'no.existe', contrasena: 'Demo1234' }, verificarHash);
    const claveMala = await autenticar(repo, { usuario: 'ana.analista', contrasena: 'Incorrecta1' }, verificarHash);

    expect(inexistente.ok).toBe(false);
    expect(claveMala.ok).toBe(false);
    if (!inexistente.ok && !claveMala.ok) {
      expect(inexistente.error).toBe(claveMala.error); // indistinguibles
      expect(inexistente.error).toBe(MENSAJE_UNIFORME);
    }
  });

  it('entrada malformada (sin pasar el esquema) también recibe el mensaje uniforme', async () => {
    const r = await autenticar(repo, { usuario: 'x', contrasena: 'corta' }, verificarHash);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe(MENSAJE_UNIFORME);
  });

  it('credenciales correctas devuelven la identidad completa', async () => {
    const r = await autenticar(repo, { usuario: 'ana.analista', contrasena: 'Demo1234' }, verificarHash);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.datos?.rol).toBe('ANALISTA');
      expect(r.datos?.sucursalId).toBe('suc-central');
    }
  });

  it('anti-fijación: cada login exitoso crea una sesión NUEVA', async () => {
    const r1 = await autenticar(repo, { usuario: 'ana.analista', contrasena: 'Demo1234' }, verificarHash);
    const r2 = await autenticar(repo, { usuario: 'ana.analista', contrasena: 'Demo1234' }, verificarHash);
    if (r1.ok && r2.ok) expect(r1.datos?.sesionId).not.toBe(r2.datos?.sesionId);
    expect(r1.ok && r2.ok).toBe(true);
  });

  it('el fallo no crea sesión (nada que robar)', async () => {
    const r = await autenticar(repo, { usuario: 'ana.analista', contrasena: 'Incorrecta1' }, verificarHash);
    expect(r.ok).toBe(false);
    if (!r.ok) expect('datos' in r).toBe(false);
  });
});
