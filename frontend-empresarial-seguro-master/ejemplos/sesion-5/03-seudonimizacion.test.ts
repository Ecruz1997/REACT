// Sesión 5 · Tema 9 — Tokenización y el derecho de supresión, Ley 8968 (§9.3–9.4).
//
// El dilema de la clase: la bitácora es append-only (trazabilidad regulatoria) pero la
// Ley 8968 da derecho de supresión. La salida NO es borrar: es SEUDONIMIZAR — sustituir
// el dato por un token no reversible que conserva el rastro y la capacidad de agrupar.
import { describe, it, expect } from 'vitest';
import { tokenizar } from '@/lib/field-crypto';

const SECRETO = 'secreto-de-tokenizacion-de-clase';

describe('tokenización determinista (§9.3)', () => {
  it('el mismo valor produce siempre el mismo token: se puede buscar y agrupar', () => {
    expect(tokenizar('112340567', SECRETO)).toBe(tokenizar('112340567', SECRETO));
  });

  it('el token no contiene el valor (no es cifrado: es hash con secreto)', () => {
    const token = tokenizar('112340567', SECRETO);
    expect(token).not.toContain('112340567');
    expect(token).toHaveLength(24);
  });

  it('valores distintos, tokens distintos: la agrupación no colisiona en la práctica', () => {
    expect(tokenizar('112340567', SECRETO)).not.toBe(tokenizar('112340568', SECRETO));
  });

  it('sin el secreto no se puede recalcular: otro secreto, otro token', () => {
    // Un atacante con la bitácora filtrada no puede probar cédulas por fuerza bruta
    // sin el secreto del servidor.
    expect(tokenizar('112340567', SECRETO)).not.toBe(tokenizar('112340567', 'otro-secreto-distinto-largo'));
  });

  it('supresión con rastro: la bitácora seudonimizada sigue correlacionando eventos', () => {
    // Tras una solicitud de supresión, los registros del cliente quedan así:
    const registroViejo = { actor: tokenizar('112340567', SECRETO), evento: 'SOLICITUD_CREADA' };
    const registroNuevo = { actor: tokenizar('112340567', SECRETO), evento: 'SOLICITUD_APROBADA' };
    // El dato personal ya no está — pero el auditor aún ve que fue EL MISMO actor.
    expect(registroViejo.actor).toBe(registroNuevo.actor);
  });
});
