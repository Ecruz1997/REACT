import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="contenedor estado">
      <h1>No encontrado</h1>
      <p>El recurso no existe o no está disponible para su usuario.</p>
      <Link className="btn" href="/solicitudes">Volver a solicitudes</Link>
    </div>
  );
}
