'use client';

import { useState, useTransition } from 'react';
import { aprobarSolicitud, rechazarSolicitud } from '@/app/solicitudes/actions';

export function AccionesAprobacion({ id }: { id: string }) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function ejecutar(fn: (e: unknown) => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const r = await fn({ id });
      if (!r.ok) setError(r.error ?? 'No autorizado');
    });
  }

  return (
    <div>
      <div className="fila-acciones">
        <button className="btn" disabled={pendiente} onClick={() => ejecutar(aprobarSolicitud)}>Aprobar</button>
        <button className="btn peligro" disabled={pendiente} onClick={() => ejecutar(rechazarSolicitud)}>Rechazar</button>
      </div>
      {error && <p className="error" role="alert" style={{ marginTop: '0.5rem' }}>{error}</p>}
    </div>
  );
}
