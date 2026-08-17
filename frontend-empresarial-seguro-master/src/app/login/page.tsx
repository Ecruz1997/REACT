'use client';

import { useActionState } from 'react';
import { iniciarSesion } from './actions';

export default function LoginPage() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, null);

  return (
    <div className="contenedor" style={{ maxWidth: 420 }}>
      <div className="panel" style={{ marginTop: '3rem' }}>
        <h1 style={{ marginTop: 0 }}>Bóveda</h1>
        <p className="etiqueta">Portal de operaciones · acceso restringido</p>

        <form action={accion} noValidate>
          <div className="campo">
            <label htmlFor="usuario">Usuario</label>
            <input id="usuario" name="usuario" autoComplete="username" required />
          </div>
          <div className="campo">
            <label htmlFor="contrasena">Contraseña</label>
            <input id="contrasena" name="contrasena" type="password" autoComplete="current-password" required />
          </div>

          {estado && !estado.ok && (
            <p className="error" role="alert">{estado.error}</p>
          )}

          <button className="btn" type="submit" disabled={pendiente} style={{ width: '100%' }}>
            {pendiente ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="etiqueta" style={{ marginTop: '1.5rem' }}>
          Demo — usuario: ana.analista · contraseña: Demo1234
        </p>
      </div>
    </div>
  );
}
