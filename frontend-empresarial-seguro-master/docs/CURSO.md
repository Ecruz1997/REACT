# Mapeo del repositorio a los 12 temas oficiales — SOFT-750

Regla de diseño: **no se quitó ningún tema del programa oficial**. Cada tema tiene una
implementación concreta en el repo; el material de seguridad adicional (CSP, cadena de
suministro, BFF) entra como *profundidad* dentro de un tema, o como anexo fuera de evaluación,
nunca reemplazando un tema.

| # | Tema oficial | Dónde vive en el repo | Profundidad añadida |
|---|--------------|------------------------|---------------------|
| 1 | Fundamentos de autenticación moderna (JWT, **access vs refresh**, roles/claims) | `src/lib/tokens.ts`, `tests/unit/tokens.test.ts` | Sesión revocable respaldada en base; algoritmo fijado explícitamente |
| 2 | Almacenamiento seguro (cookies httpOnly, riesgos de localStorage) | `src/lib/session.ts` (cookies httpOnly, SameSite) | Prefijo `__Host-` para producción; refresh en cookie aparte |
| 3 | Vulnerabilidades comunes (XSS, CSRF, OWASP frontend) | `src/lib/sanitize.ts`, `middleware.ts` (CSP) | CSP con nonce + `strict-dynamic`; escapado de salida vs sanitización al escribir |
| 4 | Implementación práctica (login, sesión, logout) | `src/app/login/`, `src/app/logout/` | Mensaje de error uniforme; rotación de sesión anti-fijación |
| 5 | Protección en React (rutas privadas, render por rol, no-autorizado) | `src/app/**/page.tsx`, `src/components/Barra.tsx`, `no-autorizado/` | Autorización en la consulta, no en el render; matriz probada |
| 6 | Next.js esencial (arquitectura, routing por archivos, layouts) | Estructura `src/app/`, `layout.tsx` | — |
| 7 | SSR aplicado a seguridad (SSR, validación de sesión en servidor, **middleware**) | `middleware.ts`, `session.ts`, `dynamic = 'force-dynamic'` | Matiz: middleware evadible (CVE-2025-29927) ⇒ defensa en capas, no borde único |
| 8 | Integración con API empresarial (fetch estructurado, errores centralizados) | `src/lib/repository.ts` + impls; `ResultadoAccion` | La interfaz de repositorio como punto de integración con el core |
| 9 | Manejo responsable de datos (qué no exponer, protección visual, cifrado en tránsito) | `src/lib/masking.ts`, HSTS en `next.config.ts` | Proyección mínima en listados; cuenta completa solo al aprobar |
| 10 | Arquitectura frontend empresarial (organización, separación cliente-servidor) | Separación `lib` puro / `app` Next; `server-only` | Lógica pura testeable; la "costura" del repositorio |
| 11 | Diseño responsivo empresarial (mobile-first, layouts adaptativos, accesibilidad) | `src/app/globals.css`, componentes | Grilla responsiva, foco visible, `prefers-reduced-motion`, labels asociados |
| 12 | UX en apps autenticadas (estados críticos, feedback, **manejo 401/403**) | `error.tsx`, `not-found.tsx`, `no-autorizado/`, mensajes de acción | Estados de error que no filtran detalle interno; feedback de denegación |

## Material adicional (anexo, fuera del programa evaluado)

Estos temas NO son parte de los 12 oficiales. Se ofrecen como profundidad para el objetivo
real del entregable (que el PoC apruebe la revisión de ciberseguridad del BCR). Pueden verse
en la Sesión de cierre o como asignaciones:

- **Cadena de suministro / pipeline**: `npm ci --ignore-scripts`, escaneo de secretos,
  SAST (Semgrep), verificación en CI. (Material de defensa, no de currículo.)
- **BFF (Backend for Frontend)**: si el BCR expone un backend existente, el patrón correcto
  para no filtrar tokens al navegador. Diagrama + discusión, no implementación frontend.
- **Endurecimiento de despliegue**: rate limiting, WAF, y el mapeo a normativa
  (SUGEF 14-17, Ley 8968 de protección de datos, Ley 7600 de accesibilidad).

## Rúbrica

La evaluación sigue la **rúbrica oficial** (6 criterios de proyecto, 5 de prácticas, escala 1–10;
proyecto 55% / prácticas 45%). Este repo no redefine la rúbrica: la satisface. Ver la página
madre en Notion para el instrumento de evaluación.
