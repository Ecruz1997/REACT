# Sesión 1 — Autenticación Moderna y Almacenamiento Seguro (Temas 1–2)

Respaldo ejecutable de la página de Notion *Sesión 1 — Autenticación Moderna y
Almacenamiento Seguro*. Correr: `npx vitest run ejemplos/sesion-1`.

| Archivo | Tema oficial | Sección de Notion | Verificación |
|---|---|---|---|
| `01-jwt-firmar-verificar.test.ts` | T1 | §1.2 JWT: estructura y verificación · §1.3 Access vs refresh | test (6 casos) |
| `02-rotacion-refresh.test.ts` | T1 | §1.4 Rotación de refresh con detección de reuso | test (3 casos) |
| `03-validacion-claims.ts` + `.test.ts` | T1 | §1.5 HS256 vs RS256 y validación de claims — la tabla de claims, fila por fila | test (6 casos) |
| `04-cookie-sesion.ts` | T2 | §2.1 La cookie de sesión: cuatro atributos · §2.2 Dónde vive cada cosa | typecheck-only (usa `cookies()` de Next) |

Notas:

- `01` y `02` ejercitan directamente la base verificada (`@/lib/tokens`, `@/lib/refresh`)
  con `RepositorioMemoria` — el mismo patrón de inyección que usan las prácticas.
- `03` es código **nuevo de clase** (Bóveda no integra un IdP): verifica un token RS256
  validando `iss`, `aud`, `exp` y `jti`; cada test es un ataque de la tabla de §1.5.
- `04` es la política de cookies de §2.1 aislada, incluido el matiz del prefijo
  `__Host-` (solo producción, porque exige HTTPS).
