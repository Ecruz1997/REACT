# Ejemplos ejecutables por sesión — SOFT-750

Cada snippet que aparece en las páginas de sesión de Notion existe aquí como un archivo
real: compila con `tsc --noEmit` estricto (entra al `npm run typecheck` y a CI) y, cuando
la lógica es pura, tiene un test que lo demuestra (`npm run test:ejemplos`).

| Carpeta | Sesión | Temas oficiales |
|---|---|---|
| `sesion-1/` | Autenticación Moderna y Almacenamiento Seguro | T1, T2 |
| `sesion-2/` | Vulnerabilidades Comunes e Implementación Segura | T3, T4 |
| `sesion-3/` | Protección en React y Next.js Esencial | T5, T6 |
| `sesion-4/` | SSR Aplicado a Seguridad e Integración con API | T7, T8 |
| `sesion-5/` | Manejo Responsable de Datos y Arquitectura Frontend | T9, T10 |
| `sesion-6/` | Diseño Responsivo y UX en Apps Autenticadas | T11, T12 |

Convenciones:

- Los ejemplos **usan** la base verificada (`@/lib/...`), nunca la copian. Lo que la base
  no tiene (p. ej. validación de claims de un IdP) se implementa aquí, aparte.
- Ejemplos que requieren el runtime de Next (Server Components, Server Actions, cookies)
  son **compilables pero no testeables en unit** — el README de cada sesión los marca
  como *typecheck-only*.
- El README de cada sesión mapea archivo → tema oficial → sección de la página de Notion.
