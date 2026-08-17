import { verificarSesion } from '@/lib/session';
import { redirect } from 'next/navigation';
import { repo } from '@/lib/db';
import { listarSolicitudes } from '@/lib/solicitudes-service';
import { Barra } from '@/components/Barra';
import { FormularioSolicitud } from '@/components/FormularioSolicitud';
import Link from 'next/link';

// Ruta autenticada: nunca debe cachearse entre usuarios (Tema: caché como fuga).
export const dynamic = 'force-dynamic';

export default async function SolicitudesPage() {
  const actor = await verificarSesion();
  if (!actor) redirect('/login');

  const solicitudes = await listarSolicitudes(repo(), actor);

  return (
    <>
      <Barra rol={actor.rol} />
      <main className="contenedor">
        <h1>Solicitudes</h1>

        {actor.rol === 'ANALISTA' && <FormularioSolicitud />}

        {solicitudes.length === 0 ? (
          <div className="estado">
            <p>No hay solicitudes para mostrar.</p>
          </div>
        ) : (
          <div className="grilla">
            {solicitudes.map((s) => (
              <Link key={s.id} href={`/solicitudes/${s.id}`} className="panel" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className={`chip ${s.estado}`}>{s.estado}</span>
                <div className="monto" style={{ marginTop: '0.5rem' }}>
                  {s.monto.toLocaleString('es-CR')} {s.moneda}
                </div>
                <div className="cuenta">{s.cuentaEnmascarada}</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
