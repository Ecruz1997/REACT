// Datos de arranque compartidos entre el seed de runtime y los tests.
// Contraseña de todos los usuarios de demo: "Demo1234" (hash scrypt más abajo, en db/seed).
import type { Usuario, Solicitud } from './types';

export const SUCURSAL_A = 'suc-central';
export const SUCURSAL_B = 'suc-heredia';

// UUIDs fijos para que los tests sean deterministas.
export const IDS = {
  analistaA: '11111111-1111-1111-1111-111111111111',
  aprobadorA: '22222222-2222-2222-2222-222222222222',
  aprobadorA2: '55555555-5555-5555-5555-555555555555',
  auditor: '33333333-3333-3333-3333-333333333333',
  analistaB: '44444444-4444-4444-4444-444444444444',
  solicitudA: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  solicitudB: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
  solicitudResuelta: 'cccccccc-cccc-4ccc-cccc-cccccccccccc',
} as const;

// hashContrasena se rellena en el seed real; en los tests no se usa el login.
export function usuariosDemo(hash = 'x'): Usuario[] {
  return [
    { id: IDS.analistaA, usuario: 'ana.analista', nombre: 'Ana Analista', rol: 'ANALISTA', sucursalId: SUCURSAL_A, cedula: '112340567', hashContrasena: hash },
    { id: IDS.aprobadorA, usuario: 'beto.aprobador', nombre: 'Beto Aprobador', rol: 'APROBADOR', sucursalId: SUCURSAL_A, cedula: '203450678', hashContrasena: hash },
    { id: IDS.aprobadorA2, usuario: 'carla.aprobadora', nombre: 'Carla Aprobadora', rol: 'APROBADOR', sucursalId: SUCURSAL_A, cedula: '304560789', hashContrasena: hash },
    { id: IDS.auditor, usuario: 'dina.auditora', nombre: 'Dina Auditora', rol: 'AUDITOR', sucursalId: SUCURSAL_A, cedula: '405670890', hashContrasena: hash },
    { id: IDS.analistaB, usuario: 'edu.heredia', nombre: 'Edu Heredia', rol: 'ANALISTA', sucursalId: SUCURSAL_B, cedula: '506780901', hashContrasena: hash },
  ];
}

export function solicitudesDemo(): Solicitud[] {
  return [
    { id: IDS.solicitudA, sucursalId: SUCURSAL_A, creadaPor: IDS.analistaA, cuentaDestino: 'CR12345678901234567890', monto: 1_250_000, moneda: 'CRC', justificacion: 'Pago a proveedor de servicios de limpieza mensual', estado: 'PENDIENTE', creadaEn: '2026-08-01T10:00:00.000Z', resueltaPor: null, resueltaEn: null },
    { id: IDS.solicitudB, sucursalId: SUCURSAL_B, creadaPor: IDS.analistaB, cuentaDestino: 'CR09876543210987654321', monto: 800_000, moneda: 'CRC', justificacion: 'Reembolso de viáticos de capacitación regional', estado: 'PENDIENTE', creadaEn: '2026-08-02T11:00:00.000Z', resueltaPor: null, resueltaEn: null },
    { id: IDS.solicitudResuelta, sucursalId: SUCURSAL_A, creadaPor: IDS.analistaA, cuentaDestino: 'CR11112222333344445555', monto: 500_000, moneda: 'CRC', justificacion: 'Pago de licencia de software anual del equipo', estado: 'APROBADA', creadaEn: '2026-07-20T09:00:00.000Z', resueltaPor: IDS.aprobadorA, resueltaEn: '2026-07-21T09:00:00.000Z' },
  ];
}
