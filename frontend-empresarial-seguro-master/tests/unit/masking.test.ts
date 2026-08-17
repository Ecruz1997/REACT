// Enmascaramiento (Tema 9).
import { describe, it, expect } from 'vitest';
import { enmascararCuenta, enmascararCedula, aListado } from '@/lib/masking';
import { solicitudesDemo } from '@/lib/fixtures';

describe('enmascaramiento', () => {
  it('la cuenta solo muestra los últimos 4 dígitos', () => {
    expect(enmascararCuenta('CR12345678901234567890')).toBe('•••• 7890');
  });

  it('la cédula oculta el bloque central', () => {
    expect(enmascararCedula('112340567')).toBe('1-••••-567');
  });

  it('aListado no incluye la cuenta completa', () => {
    const l = aListado(solicitudesDemo()[0]);
    expect(JSON.stringify(l)).not.toContain('CR12345678901234567890');
    expect(l.cuentaEnmascarada).toBe('•••• 7890');
  });
});
