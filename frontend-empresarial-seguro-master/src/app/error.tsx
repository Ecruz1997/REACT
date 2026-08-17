'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="contenedor estado" role="alert">
      <h1>No pudimos completar la operación</h1>
      <p>Intente de nuevo. Si el problema persiste, comuníquese con soporte e indique la hora exacta.</p>
      <button className="btn" onClick={reset}>Reintentar</button>
    </div>
  );
}
