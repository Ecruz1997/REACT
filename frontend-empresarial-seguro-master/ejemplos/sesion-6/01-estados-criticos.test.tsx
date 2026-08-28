// @vitest-environment jsdom
// Sesión 6 · Tema 12 — Los cuatro estados, verificados con Testing Library.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PanelSolicitudes } from './01-estados-criticos';

afterEach(cleanup); // sin globals de Vitest, el desmontaje es explícito

describe('los cuatro estados críticos (tabla de T12)', () => {
  it('cargando: lo dice, y el botón queda deshabilitado', () => {
    render(<PanelSolicitudes estado={{ tipo: 'cargando' }} />);
    expect(screen.getByText('Enviando…')).toBeDisabled();
    expect(screen.getByText(/cargando solicitudes/i)).toBeInTheDocument();
  });

  it('vacío: mensaje claro, no una tabla en blanco', () => {
    render(<PanelSolicitudes estado={{ tipo: 'vacio' }} />);
    expect(screen.getByRole('heading', { name: /sin solicitudes/i })).toBeInTheDocument();
  });

  it('error: role="alert", accionable, y SOLO la referencia opaca', () => {
    render(<PanelSolicitudes estado={{ tipo: 'error', referencia: 'ab12cd34' }} />);
    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('ab12cd34'); // lo que soporte necesita
    expect(alerta.textContent).not.toMatch(/sql|stack|trace|exception/i); // lo que el atacante quisiera
  });

  it('no autorizado: página dedicada, anunciada como alerta', () => {
    render(<PanelSolicitudes estado={{ tipo: 'noAutorizado' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/no autorizado/i);
  });

  it('datos: la grilla pinta la cuenta YA enmascarada (lo único que recibió)', () => {
    render(
      <PanelSolicitudes
        estado={{
          tipo: 'datos',
          solicitudes: [{
            id: 's1', cuentaEnmascarada: '•••• 7890', monto: 1000,
            moneda: 'CRC', estado: 'PENDIENTE', creadaEn: '2026-08-01T10:00:00.000Z',
          }],
        }}
      />,
    );
    expect(screen.getByText('•••• 7890')).toBeInTheDocument();
  });
});
