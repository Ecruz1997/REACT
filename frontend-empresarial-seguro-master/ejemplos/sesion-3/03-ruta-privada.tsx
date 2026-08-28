// Sesión 3 · Tema 5 — Ruta privada: se protege en el Server Component (§5.1).
//
// Typecheck-only: es una página de ejemplo (no está bajo src/app/, no se rutea).
// La versión real y ruteada es src/app/solicitudes/page.tsx.
//
// Los tres estados de la tabla de §5.3, en su lugar exacto:
//   401 no autenticado      → redirect('/login')
//   403 sin permiso         → redirect('/no-autorizado')
//   404 ajeno o inexistente → notFound()  (cierra el IDOR: misma respuesta para ambos)
import { redirect, notFound } from 'next/navigation';
import { verificarSesion } from '@/lib/session';
import { obtenerSolicitud } from '@/lib/solicitudes-service';
import { repo } from '@/lib/db';

// Ruta autenticada: NUNCA cachear entre usuarios. Sin esto, el HTML renderizado para
// un usuario (con sus datos) podría servírsele a otro.
export const dynamic = 'force-dynamic';

export default async function DetalleProtegidoEjemplo({
  params,
}: {
  params: Promise<{ id: string }>; // Next 15+: params es una Promise
}) {
  // 1. Identidad — antes de tocar cualquier dato.
  const actor = await verificarSesion();
  if (!actor) redirect('/login'); // 401 → login

  // 2. El dato llega YA autorizado: el DAL devolvió null si es ajeno o no existe.
  const { id } = await params;
  const solicitud = await obtenerSolicitud(repo(), actor, id);
  if (!solicitud) notFound(); // 404 indistinguible — anti-IDOR

  return (
    <main className="contenedor">
      <h1>Solicitud {solicitud.id.slice(0, 8)}</h1>
      <p>
        Estado: <span className={`chip ${solicitud.estado}`}>{solicitud.estado}</span>
      </p>
    </main>
  );
}
