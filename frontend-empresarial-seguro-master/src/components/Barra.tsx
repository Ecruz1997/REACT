import { cerrarSesion } from '@/app/logout/actions';
import type { Rol } from '@/lib/types';
import Link from 'next/link';

export function Barra({ rol }: { rol: Rol }) {
  return (
    <header className="barra">
      <div>
        <Link href="/solicitudes" className="marca" style={{ textDecoration: 'none', color: 'inherit' }}>
          Bóveda
        </Link>
        <div className="rol">Rol: {rol}</div>
      </div>
      <nav className="fila-acciones">
        <Link className="btn secundario" href="/solicitudes">Solicitudes</Link>
        {rol === 'AUDITOR' && <Link className="btn secundario" href="/auditoria">Bitácora</Link>}
        <form action={cerrarSesion}>
          <button className="btn secundario" type="submit">Cerrar sesión</button>
        </form>
      </nav>
    </header>
  );
}
