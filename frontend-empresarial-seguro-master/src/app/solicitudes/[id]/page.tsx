import { verificarSesion } from '@/lib/session';
import { redirect, notFound } from 'next/navigation';
import { repo } from '@/lib/db';
import { obtenerSolicitud } from '@/lib/solicitudes-service';
import { enmascararCuenta } from '@/lib/masking';
import { Barra } from '@/components/Barra';
import { AccionesAprobacion } from '@/components/AccionesAprobacion';

export const dynamic = 'force-dynamic';

export default async function DetallePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await verificarSesion();
  if (!actor) redirect('/login');

  const { id } = await params;
  // El servicio devuelve null tanto si no existe como si es de otra sucursal (anti-IDOR).
  const solicitud = await obtenerSolicitud(repo(), actor, id);
  if (!solicitud) notFound();

  // El aprobador ve la cuenta completa al momento de decidir; los demás, enmascarada.
  const puedeAprobar = actor.rol === 'APROBADOR'
    && solicitud.estado === 'PENDIENTE'
    && solicitud.sucursalId === actor.sucursalId
    && solicitud.creadaPor !== actor.usuarioId;

  const cuentaMostrada = puedeAprobar ? solicitud.cuentaDestino : enmascararCuenta(solicitud.cuentaDestino);

  return (
    <>
      <Barra rol={actor.rol} />
      <main className="contenedor">
        <div className="panel">
          <span className={`chip ${solicitud.estado}`}>{solicitud.estado}</span>
          <h1 className="monto" style={{ marginTop: '0.5rem' }}>
            {solicitud.monto.toLocaleString('es-CR')} {solicitud.moneda}
          </h1>
          <p className="etiqueta">Cuenta destino</p>
          <p className="cuenta">{cuentaMostrada}</p>
          <p className="etiqueta">Justificación</p>
          <p>{solicitud.justificacion}</p>

          {puedeAprobar && (
            <div style={{ marginTop: '1.5rem' }}>
              <AccionesAprobacion id={solicitud.id} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
