# Sesión 5 — Manejo Responsable de Datos y Arquitectura Frontend (Temas 9–10)

Respaldo ejecutable de la página de Notion *Sesión 5 — Manejo Responsable de Datos y
Arquitectura Frontend*. Correr: `npx vitest run ejemplos/sesion-5`.

| Archivo | Tema oficial | Sección de Notion | Verificación |
|---|---|---|---|
| `01-minimizacion.test.ts` | T9 | §9.1 Minimización · §9.2 Enmascaramiento en el servidor | test (6 casos) |
| `02-cifrado-campo.test.ts` | T9 | §9.3 Cifrado en tránsito y a nivel de campo | test (5 casos) |
| `03-seudonimizacion.test.ts` | T9 | §9.3 tokenización · §9.4 supresión Ley 8968 sin romper la bitácora | test (5 casos) |
| `04-testing-de-abuso.test.ts` | T10 (Anexo) | Anexo · Testing de abuso — la matriz parametrizada con verificación de efecto | test (4 casos por `it.each` + 1) |
| `05-pii-payload-rsc.tsx` | T9, T10 | §9.4 PII en el payload RSC — proyección mínima al cruzar la frontera | typecheck-only (JSX) |

Notas:

- El Tema 10 (lógica pura + cáscara, la costura) quedó demostrado ejecutablemente en
  `ejemplos/sesion-4/03-costura-repositorio.test.ts` (la misma suite sobre memoria y
  SQLite); `04` y `05` lo complementan del lado del testing y de la frontera RSC.
- `03` resuelve en código el dilema regulatorio de la clase: bitácora append-only
  (trazabilidad) + derecho de supresión (Ley 8968) ⇒ seudonimizar, no borrar.
- `04` es la versión "construida en vivo" del patrón; la suite formal de regresión
  vive en `tests/unit/practica-2/extra/authz-efecto.test.ts`.
