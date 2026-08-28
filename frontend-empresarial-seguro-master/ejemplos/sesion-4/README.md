# Sesión 4 — SSR Aplicado a Seguridad e Integración con API (Temas 7–8)

Respaldo ejecutable de la página de Notion *Sesión 4 — SSR Aplicado a Seguridad e
Integración con API*. Correr: `npx vitest run ejemplos/sesion-4`.

| Archivo | Tema oficial | Sección de Notion | Verificación |
|---|---|---|---|
| `01-ssrf-allowlist.test.ts` | T8 | §8.3 SSRF en el fetch de servidor — el mapa de ataque, fila por fila | test (7 casos) |
| `02-errores-con-referencia.ts` + `.test.ts` | T8 | §8.4 Manejo centralizado de errores — referencia opaca | test (4 casos) |
| `03-costura-repositorio.test.ts` | T8, T10 | §8.1 Fetch estructurado tras un repositorio — el MISMO test sobre memoria y SQLite | test (3 casos × 2 impl.) |
| `04-bff-token-exchange.ts` | T8 | §8.2 BFF: token exchange on-behalf-of (RFC 8693) | typecheck-only (sin STS real) |
| `05-csp-nonce.ts` + `.test.ts` | T7 (Extra) | Extra · Endurecimiento — CSP con nonce, sin `unsafe-inline` | test (3 casos) |

Notas:

- El Tema 7 (validación de sesión en servidor, `force-dynamic`) ya quedó ejecutable en
  `ejemplos/sesion-3/03-ruta-privada.tsx`; esta sesión lo complementa con el
  endurecimiento (`05`).
- `03` es la demostración estrella de la sesión: `describe.each` corre la MISMA suite
  de negocio contra `RepositorioMemoria` y `RepositorioSqlite` (archivo temporal) —
  la costura probada, no afirmada.
- `02` es código **nuevo de clase**: los servicios de Bóveda no lanzan, así que el
  envoltorio se demuestra aparte, con el logger inyectado.
