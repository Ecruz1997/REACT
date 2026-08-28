'use client';
// Sesión 6 · Tema 12 — Los cuatro estados críticos que SE DISEÑAN (tabla de T12).
//
// Cargando · Vacío · Error · No autorizado: ninguno se deja "caer" al default.
// El estado es una unión discriminada: el compilador obliga a diseñar los cuatro —
// no existe un render posible sin decidir qué ve el usuario en cada uno.
import type { SolicitudListado } from '@/lib/masking';

export type EstadoPanel =
  | { tipo: 'cargando' }
  | { tipo: 'vacio' }
  | { tipo: 'error'; referencia: string } // referencia opaca (Sesión 4), nunca el detalle
  | { tipo: 'noAutorizado' }
  | { tipo: 'datos'; solicitudes: SolicitudListado[] };

export function PanelSolicitudes({ estado }: { estado: EstadoPanel }) {
  switch (estado.tipo) {
    case 'cargando':
      // El botón que disparó la carga queda deshabilitado y lo DICE (useTransition
      // en el componente real). El usuario nunca duda si "agarró" el clic.
      return (
        <section className="estado" aria-busy="true">
          <p>Cargando solicitudes…</p>
          <button className="btn" disabled>Enviando…</button>
        </section>
      );

    case 'vacio':
      // Mensaje claro, no una tabla en blanco: "no hay datos" es un estado, no un bug.
      return (
        <section className="estado">
          <h1>Sin solicitudes pendientes</h1>
          <p>Cuando un analista cree una solicitud, aparecerá aquí.</p>
        </section>
      );

    case 'error':
      // role="alert" (lo anuncia el lector de pantalla), accionable, sin detalle interno.
      return (
        <section className="estado" role="alert">
          <h1>Algo salió mal</h1>
          <p>Intente de nuevo. Si persiste, indique la referencia {estado.referencia} a soporte.</p>
        </section>
      );

    case 'noAutorizado':
      // En ruta propia esto es la página /no-autorizado; embebido, el mismo diseño.
      return (
        <section className="estado" role="alert">
          <h1>Acceso no autorizado</h1>
          <p>Su cuenta no tiene permisos para ver esta información.</p>
        </section>
      );

    case 'datos':
      return (
        <div className="grilla">
          {estado.solicitudes.map((s) => (
            <article key={s.id} className="panel">
              <span className="cuenta">{s.cuentaEnmascarada}</span>
              <span className={`chip ${s.estado}`}>{s.estado}</span>
            </article>
          ))}
        </div>
      );
  }
}
