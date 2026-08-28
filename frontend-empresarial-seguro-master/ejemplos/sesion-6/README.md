# Sesión 6 — Diseño Responsivo y UX en Apps Autenticadas (Temas 11–12)

Respaldo ejecutable de la página de Notion *Sesión 6 — Diseño Responsivo y UX en Apps
Autenticadas*. Correr: `npx vitest run ejemplos/sesion-6`.

| Archivo | Tema oficial | Sección de Notion | Verificación |
|---|---|---|---|
| `01-estados-criticos.tsx` + `.test.tsx` | T12 | Estados críticos (los cuatro que se diseñan) | test (5 casos, jsdom) |
| `02-feedback-accesible.tsx` + `.test.tsx` | T11, T12 | Feedback seguro · tabla de Accesibilidad (etiquetas asociadas) | test (3 casos, jsdom) |
| `03-error-boundary-seguro.tsx` + `.test.tsx` | T12 | Callout: `error.tsx` nunca renderiza `error.message` | test (4 casos, jsdom) |
| `04-grilla-responsiva.css` | T11 | Mobile-first (el snippet CSS de la clase) | visual (DevTools: 360/640/900px) |

Notas:

- Los tests de UI corren en **jsdom** (pragma `@vitest-environment jsdom`) con
  Testing Library: las aserciones de accesibilidad (`getByLabelText`, `getByRole`,
  `toHaveAccessibleDescription`) fallan exactamente cuando fallaría un lector de
  pantalla — la accesibilidad deja de ser una opinión.
- `01` usa una **unión discriminada** para los cuatro estados: el `switch` exhaustivo
  obliga en compilación a diseñar cada uno (no existe "se me olvidó el estado vacío").
- `03` se prueba con un error que trae SQL y rutas internas: el test verifica que
  NADA de eso llega al DOM, solo el `digest`.
- El comportamiento E2E de 401/403 ya lo cubren `tests/e2e/auth.spec.ts` y
  `tests/e2e/doble-control.spec.ts`.
