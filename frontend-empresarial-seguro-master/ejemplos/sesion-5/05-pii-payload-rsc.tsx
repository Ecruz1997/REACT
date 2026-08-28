// Sesión 5 · Tema 9 — PII en el payload RSC: se proyecta lo mínimo (§9.4, a fondo).
//
// Typecheck-only (JSX de ejemplo, no ruteado).
// La regla de la clase: TODO objeto que un Server Component pasa a un Client Component
// se serializa COMPLETO al HTML. Pasar el objeto "por comodidad" publica hashContrasena,
// cedula y la cuenta completa en el payload de la página — aunque el componente no los pinte.
import type { Solicitud } from '@/lib/types';
import { aListado, type SolicitudListado } from '@/lib/masking';

// ❌ El anti-patrón (dejado como tipo para poder señalarlo en clase):
//    <TarjetaCliente solicitud={solicitud} />  ← Solicitud entera al navegador:
//    cuentaDestino completa, justificacion, creadaPor... todo viaja en el HTML.
type PropsQueFiltran = { solicitud: Solicitud };

// ✅ El patrón: el Client Component DECLARA el tipo mínimo que necesita.
//    SolicitudListado ni siquiera tiene un campo cuentaDestino que filtrar.
function TarjetaCliente({ solicitud }: { solicitud: SolicitudListado }) {
  return (
    <article className="panel">
      <span className="cuenta">{solicitud.cuentaEnmascarada}</span>
      <span className="monto">{solicitud.monto.toLocaleString('es-CR')}</span>
    </article>
  );
}

// El Server Component proyecta ANTES de cruzar la frontera:
export function ListadoMinimizado({ solicitudes }: { solicitudes: Solicitud[] }) {
  return (
    <div className="grilla">
      {solicitudes.map((s) => (
        // aListado() decide QUÉ cruza al navegador — la proyección es el control.
        <TarjetaCliente key={s.id} solicitud={aListado(s)} />
      ))}
    </div>
  );
}

// El tipo del anti-patrón queda referenciado para que el archivo lo documente
// sin exportar nada peligroso:
export type { PropsQueFiltran as _AntiPatronNoUsar };
