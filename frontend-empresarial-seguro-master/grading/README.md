# Harness de calificación — Bóveda

Califica una entrega ejecutando pruebas de **comportamiento observable** mapeadas a la
**rúbrica oficial de prácticas** (5 criterios). No inspecciona nombres internos, así que
funciona contra cualquier entrega que respete el contrato (`grading/contract.md`).

## Cómo calificar una entrega

```bash
# 1. En el repo del estudiante: sembrar y levantar
npm ci && npm run db:seed
npm run build && npm start        # queda en http://localhost:3000

# 2. En otra terminal (desde este repo o el del estudiante): apuntar el harness y correr
export BASE_URL=http://localhost:3000
node grading/grade.mjs
```

La primera vez, para los E2E: `npx playwright install chromium`.

## Qué produce

Un reporte por criterio oficial con `pasados/total` y una **banda sugerida**
(Insatisfactoria 1–4 · Aceptable 5–7 · Satisfactoria 8–10). La banda es una sugerencia
objetiva; la nota final la fija el docente, sobre todo en C5 (organización/explicación) y
en la defensa, que llevan juicio humano.

## Qué cubre cada capa

- `http-smoke.mjs` — sin navegador: protección de rutas, cabeceras de seguridad, estados.
  Corre en cualquier entorno (útil en CI).
- `acceptance.spec.ts` — Playwright: flujos autenticados (rol, IDOR, doble control, logout,
  teclado). Requiere el navegador instalado.

## Contrato

Toda entrega debe poblar el seed fijo de `grading/contract.md` (usuarios, contraseñas, IDs
de solicitudes). Es lo que hace la calificación determinista y comparable entre entregas.
