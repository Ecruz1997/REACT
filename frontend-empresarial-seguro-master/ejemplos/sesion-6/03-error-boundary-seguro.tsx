'use client';
// Sesión 6 · Tema 12 — El error.tsx que NUNCA renderiza error.message (callout de T12).
//
// "En un despliegue mal configurado es la diferencia entre una página de error y un
// volcado de stack". El mensaje del Error puede traer SQL, rutas de archivos, versiones.
// Lo único del error que se muestra es el digest: la referencia opaca que Next genera
// para correlacionar con el log del servidor (el mismo patrón de la Sesión 4).
// Forma idéntica a src/app/error.tsx (la convención error.tsx del App Router).
export default function ErrorBoundarySeguro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="contenedor">
      <section className="estado" role="alert">
        <h1>Algo salió mal</h1>
        <p>
          Intente de nuevo. Si el problema persiste, contacte a soporte
          {error.digest ? ` e indique la referencia ${error.digest}` : ''}.
        </p>
        {/* Nunca: <p>{error.message}</p> — ni en un comentario de "debug temporal". */}
        <button className="btn" onClick={reset}>
          Reintentar
        </button>
      </section>
    </main>
  );
}
