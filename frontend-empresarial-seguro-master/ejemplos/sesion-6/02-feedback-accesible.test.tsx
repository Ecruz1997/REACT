// @vitest-environment jsdom
// Sesión 6 · Temas 11–12 — La accesibilidad se puede probar: estas aserciones son
// las mismas conexiones que usa un lector de pantalla.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CampoConError } from './02-feedback-accesible';

afterEach(cleanup); // sin globals de Vitest, el desmontaje es explícito

describe('campo con feedback accesible (T11/T12)', () => {
  it('la etiqueta está ASOCIADA: encontrar el campo por su nombre funciona', () => {
    render(<CampoConError id="cuentaDestino" etiqueta="Cuenta destino (IBAN CR)" />);
    // getByLabelText falla si el htmlFor no apunta al id — la asociación es real, no visual.
    expect(screen.getByLabelText('Cuenta destino (IBAN CR)')).toBeInTheDocument();
  });

  it('con error: aria-invalid, y el texto del error queda UNIDO al campo', () => {
    render(<CampoConError id="monto" etiqueta="Monto" error="El monto debe ser positivo" />);
    const campo = screen.getByLabelText('Monto');
    expect(campo).toHaveAttribute('aria-invalid', 'true');
    expect(campo).toHaveAccessibleDescription('El monto debe ser positivo');
    expect(screen.getByRole('alert')).toHaveTextContent('El monto debe ser positivo');
  });

  it('sin error: sin aria-invalid ni descripción fantasma', () => {
    render(<CampoConError id="moneda" etiqueta="Moneda" />);
    const campo = screen.getByLabelText('Moneda');
    expect(campo).not.toHaveAttribute('aria-invalid');
    expect(campo).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
