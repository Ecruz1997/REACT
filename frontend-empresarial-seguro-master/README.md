# Bóveda — Proyecto de referencia · SOFT-750

Portal interno de aprobación de transferencias con **doble control**, construido como
implementación de referencia del curso *Frontend Empresarial Seguro con React y Next.js*
(Cenfotec / Banco de Costa Rica).

Este repositorio es la versión **resuelta y endurecida** que usa el instructor. Los
estudiantes parten de `boveda-base` (variante con vulnerabilidades sembradas) y van
cerrando brechas sesión por sesión hasta llegar a algo equivalente a esto.

## Roles y regla de negocio

| Rol | Puede |
|-----|-------|
| **ANALISTA** | Crear solicitudes; ver solo las de su sucursal |
| **APROBADOR** | Aprobar/rechazar de su sucursal — **nunca las que él mismo creó** (doble control) |
| **AUDITOR** | Lectura total + bitácora de auditoría |

## Stack

- **Next.js 16.3** (App Router, Turbopack) — 16.x es *Active LTS*; la línea 15.x llega a
  fin de soporte el **21 de octubre de 2026**, por lo que un PoC nuevo debe nacer sobre 16.x.
- **React 19** · **TypeScript** (strict)
- **jose** para JWT (access + refresh) · **Zod** para validación · **react-hook-form**
- **better-sqlite3** como persistencia de runtime (detrás de una interfaz de repositorio)
- **isomorphic-dompurify** para sanitización de HTML enriquecido
- **Vitest** (unit) · **Playwright** (E2E)

## Arquitectura: la lógica de seguridad es pura y testeable

El diseño separa la **decisión de seguridad** (pura, sin Next) de la **integración con el
framework** (cáscara delgada). Por eso los tests de autorización corren sin levantar el server.

```
src/lib/                      Lógica pura — sin imports de next/*
  authz.ts                    RBAC + ABAC (incluye doble control). El corazón.
  solicitudes-service.ts      verificar -> validar -> autorizar -> ejecutar -> auditar
  tokens.ts                   JWT access vs refresh, TTLs, verificación de firma/tipo
  schemas.ts                  Validación de entrada con Zod
  masking.ts                  Enmascaramiento de cuenta/cédula
  sanitize.ts                 DOMPurify + validación de esquema de URL
  repository.ts               Interfaz del repositorio (la "costura")
  repository.memory.ts        Impl en memoria (tests)
  repository.sqlite.ts        Impl SQLite (runtime)

src/lib/ (con 'server-only')  Integración con Next
  session.ts                  Lee cookies, verifica sesión revocable (el "DAL guard")
  db.ts, password.ts

src/app/                      Server Actions (cáscaras) + páginas + componentes
middleware.ts                 CSP con nonce + redirección de conveniencia (no es control de acceso)
next.config.ts                Cabeceras de seguridad
```

La **misma interfaz de repositorio** tiene dos implementaciones. En un port real, una tercera
hablaría con el core del banco sin tocar servicios ni componentes: esa es la pieza que hace
viable migrar la plataforma.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local        # y edite SESSION_SECRET (openssl rand -base64 32)
npm run db:seed                   # crea boveda.db con usuarios de demo
npm run dev                       # http://localhost:3000
```

Usuarios de demo (contraseña de todos: `Demo1234`):
`ana.analista`, `beto.aprobador`, `carla.aprobadora`, `dina.auditora`, `edu.heredia`.

## Verificación

```bash
npm run typecheck     # tsc --noEmit
npm test              # tests unitarios (Vitest): prácticas + proyecto + ejemplos de sesión
npm run test:p1       # solo Práctica 1 (base + extra)
npm run test:p2       # Prácticas 1–2 (acumulativo: incluye p1 como regresión)
npm run test:p3       # Prácticas 1–3 (acumulativo)
npm run test:ejemplos # solo los ejemplos ejecutables de las sesiones (ejemplos/)
npm run test:authz    # solo la matriz de autorización
npm run build         # build de producción
npm run e2e           # Playwright (requiere: npx playwright install chromium)
```

Los tests de práctica viven en `tests/unit/practica-{1,2,3}/{base,extra}/`: **base** cubre
lo ofertado en el programa oficial (obligatorio); **extra** es la profundidad senior que
sube nota. `tests/unit/proyecto/` cubre los temas evaluados solo en el proyecto (Tema 9).

Estado verificado en este repo: **typecheck limpio**, **build de producción correcto**,
**suite unitaria completa en verde**, y smoke test de runtime confirmando redirecciones y
cabeceras de seguridad. Los E2E están escritos; ejecútelos tras instalar el navegador de
Playwright en su máquina.

## Qué mira ciberseguridad (mapa rápido)

- Autorización en el **servidor**, pegada al dato, no en el componente. → `solicitudes-service.ts`
- IDOR: recurso ajeno se comporta como inexistente. → `obtenerSolicitud`, `tests/e2e/idor.spec.ts`
- Sesión **revocable** aunque el JWT siga vigente. → `session.ts`
- Rutas autenticadas **no cacheables** (`ƒ` en el build, no `○`).
- Cabeceras + CSP con nonce. → `middleware.ts`, `next.config.ts`
- Enmascaramiento y minimización de datos. → `masking.ts`
- Bitácora append-only de cada decisión sensible. → tabla `auditoria`

Ver `docs/CURSO.md` para el mapeo completo a los 12 temas del programa oficial.

---

## Publicar en GitHub y CI

El repositorio trae un pipeline (`.github/workflows/ci.yml`) que en cada push corre:

1. **verificar** — typecheck, tests unitarios (Vitest) y build de producción.
2. **e2e** — instala el navegador de Playwright, siembra una `e2e.db` desechable y corre los E2E.

No hace falta una base de datos externa: **better-sqlite3 es en archivo**, así que el propio
pipeline crea y siembra la base. Por eso el E2E sí corre en CI.

### Publicarlo (una vez)

```bash
# con GitHub CLI
gh repo create chocodevbits/frontend-empresarial-seguro --private --source=. --remote=origin --push

# o manual
git remote add origin git@github.com:chocodevbits/frontend-empresarial-seguro.git
git branch -M main
git push -u origin main
```

Al hacer push, el CI arranca solo. Para un despliegue real, mover `SESSION_SECRET` a
**GitHub → Settings → Secrets** en lugar del valor de pruebas del workflow.

### Nota sobre `boveda-base` (versión vulnerable)

Cuando se derive la variante deliberadamente vulnerable para las prácticas, el mismo CI sirve,
pero algunos E2E de seguridad **fallarán a propósito** hasta que el estudiante endurezca el
código — esa es justamente la señal de progreso. Conviene marcarlos como esperados-a-fallar
en el arranque, o correr solo el job `verificar` en ese repo.
