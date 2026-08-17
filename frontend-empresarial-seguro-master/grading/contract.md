# Contrato de evaluación — Bóveda

El harness de calificación prueba **comportamiento observable**, no nombres de archivos ni
funciones internas. Para que sea determinista entre entregas, toda entrega DEBE poblar su
base con este seed fijo (es el mismo que trae `boveda-base` / la implementación de referencia).

## Usuarios (contraseña de todos: `Demo1234`)

| Usuario | Rol | Sucursal |
|---|---|---|
| `ana.analista` | ANALISTA | suc-central (A) |
| `beto.aprobador` | APROBADOR | suc-central (A) |
| `carla.aprobadora` | APROBADOR | suc-central (A) |
| `dina.auditora` | AUDITOR | suc-central (A) |
| `edu.heredia` | ANALISTA | suc-heredia (B) |

## Solicitudes sembradas (IDs fijos)

| ID | Sucursal | Creada por | Estado |
|---|---|---|---|
| `aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa` | A | ana.analista | PENDIENTE |
| `bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb` | B | edu.heredia | PENDIENTE |

## Rutas que el harness asume (contrato de URLs)

- `GET /login` — formulario de acceso
- `GET /solicitudes` — listado (protegido)
- `GET /solicitudes/{id}` — detalle (protegido, filtrado por sucursal)
- `GET /auditoria` — bitácora (solo AUDITOR)
- `GET /no-autorizado` — estado 403

Si una entrega cambia estas rutas o el seed, debe declararlo; el harness se configura por
variables de entorno (`BASE_URL`, y usuarios en `grading/config.mjs`).
