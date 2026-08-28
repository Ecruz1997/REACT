'use client';
// Sesión 6 · Temas 11–12 — Feedback accesible: el patrón de campo con error (T11/T12).
//
// Las tres conexiones que hacen que el error EXISTA para todos los usuarios:
//   <label htmlFor>        → el campo tiene nombre (lector de pantalla, clic en la etiqueta)
//   aria-invalid           → el estado de error es programático, no solo un borde rojo
//   aria-describedby       → el TEXTO del error queda unido al campo que lo causó
// Es el mismo patrón de src/components/FormularioSolicitud.tsx, aislado y probado.
import type { ReactNode } from 'react';

export function CampoConError({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  children?: ReactNode; // para <select>/<textarea>; sin children se pinta un <input>
}) {
  const idError = `${id}-error`;
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children ?? (
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
        />
      )}
      {error && (
        <span id={idError} className="error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
