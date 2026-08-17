import { verificarSesion } from '@/lib/session';
import { redirect } from 'next/navigation';
import { repo } from '@/lib/db';
import { puedeVerBitacora } from '@/lib/authz';
import { Barra } from '@/components/Barra';

export const dynamic = 'force-dynamic';

export default async function AuditoriaPage() {
  const actor = await verificarSesion();
  if (!actor) redirect('/login');
  if (!puedeVerBitacora(actor).permitido) redirect('/no-autorizado');

  const registros = await repo().listarAuditoria();

  return (
    <>
      <Barra rol={actor.rol} />
      <main className="contenedor">
        <h1>Bitácora de auditoría</h1>
        <div className="panel">
          {registros.length === 0 ? (
            <p className="etiqueta">Sin eventos registrados aún.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Evento</th>
                  <th style={{ textAlign: 'left' }}>Actor</th>
                  <th style={{ textAlign: 'left' }}>Momento</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id} style={{ borderTop: '1px solid var(--panel-borde)' }}>
                    <td>{r.evento}</td>
                    <td className="cuenta">{r.actorId.slice(0, 8)}</td>
                    <td className="etiqueta">{new Date(r.ocurridoEn).toLocaleString('es-CR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
}
