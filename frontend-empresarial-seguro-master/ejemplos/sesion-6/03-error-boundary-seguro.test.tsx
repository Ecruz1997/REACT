// @vitest-environment jsdom
// Sesión 6 · Tema 12 — El contrato del error boundary: referencia sí, detalle jamás.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ErrorBoundarySeguro from './03-error-boundary-seguro';

afterEach(cleanup); // sin globals de Vitest, el desmontaje es explícito

// Un error como los que de verdad llegan: con detalle interno jugoso.
function errorInterno(): Error & { digest?: string } {
  const e = new Error(
    "SQLITE_ERROR: no such table: solicitudes — at RepositorioSqlite (/var/app/src/lib/repository.sqlite.ts:62)",
  ) as Error & { digest?: string };
  e.digest = 'a1b2c3d4';
  return e;
}

describe('error boundary seguro (T12)', () => {
  it('NUNCA renderiza error.message: ni SQL, ni rutas, ni nombres de clase', () => {
    render(<ErrorBoundarySeguro error={errorInterno()} reset={() => {}} />);
    const html = document.body.innerHTML;
    expect(html).not.toContain('SQLITE');
    expect(html).not.toContain('repository.sqlite');
    expect(html).not.toContain('/var/app');
  });

  it('sí muestra el digest: la referencia que soporte correlaciona con el log', () => {
    render(<ErrorBoundarySeguro error={errorInterno()} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('a1b2c3d4');
  });

  it('sin digest, el mensaje sigue siendo accionable (no queda un hueco raro)', () => {
    const sinDigest = new Error('detalle') as Error & { digest?: string };
    render(<ErrorBoundarySeguro error={sinDigest} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/contacte a soporte\./i);
  });

  it('el botón Reintentar invoca reset(): el error tiene salida, no callejón', () => {
    const reset = vi.fn();
    render(<ErrorBoundarySeguro error={errorInterno()} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
