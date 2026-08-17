import Link from 'next/link';

export default function NoAutorizado() {
  return (
    <div className="contenedor estado" role="alert">
      <h1>Acción no autorizada</h1>
      <p>Su rol no tiene permiso para esta operación. El intento quedó registrado en la bitácora de auditoría.</p>
      <Link className="btn secundario" href="/solicitudes">Volver</Link>
    </div>
  );
}
