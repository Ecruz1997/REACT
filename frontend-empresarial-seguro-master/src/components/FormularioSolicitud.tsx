'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EsquemaCrearSolicitud, type EntradaCrearSolicitud, type DatosCrearSolicitud } from '@/lib/schemas';
import { crearSolicitud } from '@/app/solicitudes/actions';
import { useState } from 'react';

export function FormularioSolicitud() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EntradaCrearSolicitud, unknown, DatosCrearSolicitud>({
      resolver: zodResolver(EsquemaCrearSolicitud),
    });
  const [mensaje, setMensaje] = useState<string | null>(null);

  async function onSubmit(datos: DatosCrearSolicitud) {
    setMensaje(null);
    const r = await crearSolicitud(datos);
    if (r.ok) { reset(); setMensaje('Solicitud creada correctamente.'); }
    else setMensaje(r.error);
  }

  return (
    <form className="panel" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 style={{ marginTop: 0 }}>Nueva solicitud</h2>

      <div className="campo">
        <label htmlFor="cuentaDestino">Cuenta destino (IBAN CR)</label>
        <input id="cuentaDestino" {...register('cuentaDestino')}
          aria-invalid={!!errors.cuentaDestino}
          aria-describedby={errors.cuentaDestino ? 'e-cuenta' : undefined} />
        {errors.cuentaDestino && <span id="e-cuenta" className="error" role="alert">{errors.cuentaDestino.message}</span>}
      </div>

      <div className="campo">
        <label htmlFor="monto">Monto</label>
        <input id="monto" type="number" step="0.01" {...register('monto')}
          aria-invalid={!!errors.monto} aria-describedby={errors.monto ? 'e-monto' : undefined} />
        {errors.monto && <span id="e-monto" className="error" role="alert">{errors.monto.message}</span>}
      </div>

      <div className="campo">
        <label htmlFor="moneda">Moneda</label>
        <select id="moneda" {...register('moneda')}>
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>
      </div>

      <div className="campo">
        <label htmlFor="justificacion">Justificación</label>
        <textarea id="justificacion" rows={3} {...register('justificacion')}
          aria-invalid={!!errors.justificacion}
          aria-describedby={errors.justificacion ? 'e-just' : undefined} />
        {errors.justificacion && <span id="e-just" className="error" role="alert">{errors.justificacion.message}</span>}
      </div>

      {mensaje && <p className="etiqueta" role="status">{mensaje}</p>}
      <button className="btn" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando…' : 'Crear solicitud'}
      </button>
    </form>
  );
}
