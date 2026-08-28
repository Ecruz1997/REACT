# Sesión 2 — Vulnerabilidades Comunes e Implementación Segura (Temas 3–4)

Respaldo ejecutable de la página de Notion *Sesión 2 — Vulnerabilidades Comunes e
Implementación Segura*. Correr: `npx vitest run ejemplos/sesion-2`.

| Archivo | Tema oficial | Sección de Notion | Verificación |
|---|---|---|---|
| `01-xss-sanitizacion.test.ts` | T3 | §3.1 Dónde React protege y dónde no · §3.2 Escapado vs sanitización · §3.3 (estabilidad anti-mXSS) | test (6 casos) |
| `02-enlace-seguro.test.ts` | T3 | §3.1 URLs en `href`/`src` (React no valida esquemas) | test (5 casos) |
| `03-login-uniforme.ts` + `.test.ts` | T4 | §4.1 Login estructurado — núcleo puro del mensaje uniforme y anti-fijación | test (5 casos) |
| `04-csrf-server-action.ts` | T3/T4 | §3.4 CSRF en App Router — las tres defensas y el anti-patrón GET | typecheck-only (Server Action) |
| `05-trusted-types.ts` | T3 | §3.3 Trusted Types — la política y la cabecera | typecheck-only (API del navegador) |

Notas:

- `01`/`02` ejercitan `@/lib/sanitize` (que hasta ahora no tenía tests unitarios propios).
- `03` es código **nuevo de clase**: la Server Action real (`src/app/login/actions.ts`)
  lee cookies y redirige, así que aquí se aísla la lógica pura con el repositorio y el
  verificador de hash inyectados. Cubre los puntos 1–2 de la prueba de aceptación de la
  Práctica 1.
- `05` se demuestra en vivo en el navegador; el archivo deja la cabecera y la política
  listas para copiar.
