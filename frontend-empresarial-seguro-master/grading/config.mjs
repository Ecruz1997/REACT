// Configuración del harness de calificación. Sobreescribible por entorno.
export const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

export const USUARIOS = {
  analistaA:  { usuario: 'ana.analista',     contrasena: 'Demo1234', rol: 'ANALISTA'  },
  aprobadorA: { usuario: 'beto.aprobador',   contrasena: 'Demo1234', rol: 'APROBADOR' },
  auditor:    { usuario: 'dina.auditora',    contrasena: 'Demo1234', rol: 'AUDITOR'   },
  analistaB:  { usuario: 'edu.heredia',      contrasena: 'Demo1234', rol: 'ANALISTA'  },
};

export const SOLICITUD_A = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
export const SOLICITUD_B = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
// Sembrada por el seed directo en la base (por la app no se puede: crear exige ANALISTA).
// Es la que permite probar el doble control: su creador es beto.aprobador.
export const SOLICITUD_PROPIA_APROBADOR = 'dddddddd-dddd-4ddd-dddd-dddddddddddd';

// Criterios oficiales de la rúbrica de PRÁCTICAS (5). Cada test se etiqueta con uno.
export const CRITERIOS = {
  c1: 'Configuración correcta del flujo de autenticación del laboratorio',
  c2: 'Implementación de rutas privadas y validación por rol',
  c3: 'Manejo adecuado de errores, estados y retroalimentación visual',
  c4: 'Aplicación básica de buenas prácticas de seguridad en frontend',
  c5: 'Organización, funcionamiento y explicación de la solución',
};
