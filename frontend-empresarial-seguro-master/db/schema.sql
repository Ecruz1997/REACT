-- Esquema de Bóveda (SQLite). Persistencia de referencia del curso.
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('ANALISTA','APROBADOR','AUDITOR')),
  sucursalId TEXT NOT NULL,
  cedula TEXT NOT NULL,
  hashContrasena TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sesiones (
  id TEXT PRIMARY KEY,
  usuarioId TEXT NOT NULL REFERENCES usuarios(id),
  creadaEn TEXT NOT NULL,
  ultimoAccesoEn TEXT NOT NULL,
  revocadaEn TEXT,
  refreshActual TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS solicitudes (
  id TEXT PRIMARY KEY,
  sucursalId TEXT NOT NULL,
  creadaPor TEXT NOT NULL REFERENCES usuarios(id),
  cuentaDestino TEXT NOT NULL,
  monto REAL NOT NULL,
  moneda TEXT NOT NULL CHECK (moneda IN ('CRC','USD')),
  justificacion TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
  creadaEn TEXT NOT NULL,
  resueltaPor TEXT,
  resueltaEn TEXT
);

-- Bitácora de auditoría: append-only por convención (sin UPDATE ni DELETE en el código).
CREATE TABLE IF NOT EXISTS auditoria (
  id TEXT PRIMARY KEY,
  evento TEXT NOT NULL,
  actorId TEXT NOT NULL,
  ocurridoEn TEXT NOT NULL,
  metadatos TEXT NOT NULL
);
