// Sesión 3 · Tema 5 — Render condicional por rol: ocultar NO es proteger (§5.2).
//
// Typecheck-only (JSX de ejemplo, no ruteado).
// La UI se adapta al rol para no ofrecer acciones imposibles — eso es UX.
// La SEGURIDAD vive en el servidor: aunque un usuario "fabrique" el botón con las
// DevTools, la Server Action vuelve a verificar rol, sucursal y doble control.
import type { Identidad } from '@/lib/types';
import type { SolicitudListado } from '@/lib/masking';

// Marcador del ejemplo: el componente real (cliente) es src/components/AccionesAprobacion.tsx.
function AccionesAprobacion({ id }: { id: string }) {
  return <div className="fila-acciones" data-solicitud={id} />;
}

export function TarjetaSolicitud({
  actor,
  solicitud,
}: {
  actor: Identidad;
  solicitud: SolicitudListado;
}) {
  return (
    <article className="panel">
      <span className="cuenta">{solicitud.cuentaEnmascarada}</span>
      <span className="monto">{solicitud.monto.toLocaleString('es-CR')}</span>
      <span className={`chip ${solicitud.estado}`}>{solicitud.estado}</span>

      {/* La condición decide QUÉ SE PINTA, nunca qué se PERMITE.
          Quitarla no abre un hueco de seguridad — solo muestra botones que
          fallarán con "No autorizado" al llegar al servidor. */}
      {actor.rol === 'APROBADOR' && <AccionesAprobacion id={solicitud.id} />}
    </article>
  );
}
