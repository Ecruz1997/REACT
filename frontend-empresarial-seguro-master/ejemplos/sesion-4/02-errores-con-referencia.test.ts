// Sesión 4 · Tema 8 — El contrato del patrón: el cliente ve la referencia, no el detalle.
import { describe, it, expect } from 'vitest';
import { conReferenciaOpaca, type RegistroInterno } from './02-errores-con-referencia';

describe('errores con referencia opaca (§8.4)', () => {
  it('el éxito pasa intacto', async () => {
    const r = await conReferenciaOpaca(async () => 42);
    expect(r).toEqual({ ok: true, datos: 42 });
  });

  it('el mensaje al cliente NO contiene el detalle interno', async () => {
    const registros: RegistroInterno[] = [];
    const r = await conReferenciaOpaca(async () => {
      throw new Error("SQLITE_ERROR: no such table: solicitudes at /var/app/db.ts:42");
    }, (reg) => registros.push(reg));

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).not.toContain('SQLITE');
      expect(r.error).not.toContain('db.ts');
      expect(r.error).toMatch(/^Ocurrió un error\. Referencia: [0-9a-f-]{36}$/);
    }
  });

  it('la referencia del cliente correlaciona con el log interno (que sí tiene todo)', async () => {
    const registros: RegistroInterno[] = [];
    const r = await conReferenciaOpaca(async () => {
      throw new Error('detalle interno completo');
    }, (reg) => registros.push(reg));

    expect(registros).toHaveLength(1);
    expect(registros[0]?.mensaje).toBe('detalle interno completo');
    if (!r.ok) expect(r.error).toContain(registros[0]!.ref); // misma referencia en ambos lados
  });

  it('cada fallo tiene su propia referencia (no se pueden correlacionar entre sí)', async () => {
    const refs: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await conReferenciaOpaca(async () => { throw new Error('x'); }, () => {});
      if (!r.ok) refs.push(r.error);
    }
    expect(new Set(refs).size).toBe(3);
  });
});
