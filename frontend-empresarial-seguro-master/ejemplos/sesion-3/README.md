# Sesión 3 — Protección en React y Next.js Esencial (Temas 5–6)

Respaldo ejecutable de la página de Notion *Sesión 3 — Protección en React y Next.js
Esencial*. Correr: `npx vitest run ejemplos/sesion-3`.

| Archivo | Tema oficial | Sección de Notion | Verificación |
|---|---|---|---|
| `01-matriz-autorizacion.test.ts` | T5 (Extra: la médula) | Extra · RBAC + ABAC y doble control — la tabla, ejecutable | test (7 casos, 3 por `it.each`) |
| `02-idor-dal.test.ts` | T5 (Extra) | Extra · Data Access Layer — "ajeno = inexistente" | test (5 casos) |
| `03-ruta-privada.tsx` | T5, T6 | §5.1 Rutas privadas · §5.3 Estados no autorizados (401/403/404) | typecheck-only (página de ejemplo) |
| `04-render-por-rol.tsx` | T5 | §5.2 Render condicional por rol — "ocultar no es proteger" | typecheck-only (JSX) |
| `05-server-action-blindada.ts` | T5 (Extra) | Extra · Server Action = endpoint público — verificar → validar → autorizar → auditar | typecheck-only (Server Action) |

Notas:

- El Tema 6 (routing por archivos, layouts) no necesita snippet propio: la estructura
  de `src/app/` ES el ejemplo, y `03-ruta-privada.tsx` muestra las convenciones
  (`page`-shape, `params` como Promise, `force-dynamic`) aplicadas a seguridad.
- `02` demuestra el matiz fino del DAL: la **respuesta** es indistinguible (null/404),
  pero la **bitácora** sí registra el intento con actor y recurso.
