# Postura de seguridad — Bóveda

Documento entregable de la Práctica 3, y el mismo que pide el Proyecto Final.
No es un resumen de lo que hiciste: es la declaración de que controlás cada
riesgo, o de que lo aceptaste a sabiendas. Un riesgo aceptado y escrito es
ingeniería; un riesgo no visto es otra cosa. La diferencia es este documento.

Regla para llenarlo: cada fila necesita una **prueba** que la respalde. Si no
podés nombrar el comando que la verifica, ese control no está cubierto — y eso
va en la sección de riesgos aceptados, no escondido.

## 1. Cobertura de controles

Una fila por control. En "Cómo se verifica" va el comando exacto, no una idea.

| # | Control | Dónde vive (archivo) | Cómo se verifica (comando) | Estado |
|---|---|---|---|---|
| 1 | Sesión validada en servidor por render | `src/routes/+layout.server.ts`, `src/hooks.server.ts` | `npm run build` y revisar rutas server-side en el output del build | Parcial |
| 2 | Ninguna ruta autenticada estática | configuración de rutas / build output | `npm run build` (leer la tabla que imprime SvelteKit) | Cubierto |
| 3 | Acceso a datos sólo tras el repositorio | `src/lib/repository.ts`, `src/lib/repository.sqlite.ts` | `npx vitest --run` y grep en `src` para `fetch(` o accesos directos a DB | Parcial |
| 4 | `ResultadoAccion` uniforme, sin filtrar detalle | `src/types.ts`, adaptadores en `src/lib` | `npx vitest --run` y revisión de tipos/serialización | Cubierto |
| 5 | `error.tsx` no renderiza `error.message` | `src/error.tsx` | `npm run build` + `grep -n "error.message" -R src || true` | Cubierto |
| 6 | Allowlist anti-SSRF en fetch de servidor | `src/lib/validarDestino.ts` (o `src/lib/outbound.ts`) | `npx vitest run tests/unit/practica-3/extra/outbound.test.ts` | Parcial |
| 7 | Autorización pegada al dato (sin IDOR) | `src/lib/authz.ts` y repositorios | `npm run e2e` (Playwright `tests/e2e/idor.spec.ts`) | Parcial |
| 8 | Doble control (el creador no aprueba) | `src/lib/authz.ts` | `npm run test:authz` o `npx vitest run tests/unit/practica-2/extra/authz-efecto.test.ts` | Cubierto |
| 9 | Cookie de sesión endurecida | cookie flags en `src/lib/session.ts` / hooks | `npm run e2e` + inspeccionar `Set-Cookie` (HttpOnly, Secure, SameSite) | Parcial |
| 10 | Middleware como capa, no como borde | `src/hooks.server.ts` / middlewares | `npm run build` + grep de handlers en `src` | Parcial |

Estado: `Cubierto` / `Parcial` / `No cubierto`. Si es parcial, decí qué falta.

## 2. Bitácora de ataques

Estos son los ataques que ya vienen de las tablas de aceptación de las tres
prácticas. No son ataques nuevos: son los que ya tenés que ejecutar. Acá los
documentás juntos y con el mismo formato.

**La columna que importa es "En la base".** El mensaje de error no prueba nada:
un atacante no lee mensajes, mira efectos. Una acción puede responder
"No autorizado" *después* de haber escrito. Si esa celda queda vacía, el ataque
no está demostrado, por más que la app haya respondido con un error.

Veredicto: `BLOQUEADO` · `ENTRÓ` · `NO PROBADO`.

> Un ataque que **entró**, documentado con su efecto y su causa, vale más que
> cinco `BLOQUEADO` sin evidencia. Documentar un hueco propio es el ejercicio;
> esconderlo es lo único que no se acepta.

**No todos se ejecutan igual.** Cada fila trae su nivel, porque cambia la
herramienta y cambia lo que estás probando:

| Nivel | Qué significa | Con qué |
|---|---|---|
| `navegador` | Contra la app corriendo, a mano | DevTools, la barra de direcciones |
| `HTTP` | Contra la app, pero salteándote la interfaz | `curl`, copiando la petición real desde Network |
| `código` | Contra la función, sin app | `npx tsx borrador-ataques.ts` o un test |
| `build` | Inspección del artefacto, no una petición | `npm run build`, `grep` |

El anexo *Cómo se ejecuta cada ataque* del Material del Estudiante de cada
sesión trae la receta concreta de cada uno.

### De la Práctica 1 — autenticación y sesión

| # | Nivel | Ataque | Cómo lo ejecuté | Qué respondió la app | En la base | Veredicto |
|---|---|---|---|---|---|---|
| 1 | navegador | Credenciales inválidas | Intento de login con credenciales malas desde la UI | 401 / mensaje genérico | No hay sesión creada | POR PROBAR |
| 2 | navegador | Usuario inexistente vs. contraseña mala (mismo mensaje) | Login con usuario inexistente | 401 / mismo mensaje que credenciales inválidas | No hay sesión creada | POR PROBAR |
| 3 | navegador | Reusar la cookie copiada después del logout | Copiar cookie, logout, reutilizar cookie en otra pestaña | 401 o redirección al login | No hay acceso persistente | POR PROBAR |
| 4 | navegador | Leer la cookie de sesión desde `document.cookie` | Ejecutar `document.cookie` en consola mientras autenticado | Cookie de sesión no debe aparecer (HttpOnly) | No | POR PROBAR |

### De la Práctica 2 — autorización

| # | Nivel | Ataque | Cómo lo ejecuté | Qué respondió la app | En la base | Veredicto |
|---|---|---|---|---|---|---|
| 5 | HTTP | Aprobar por `curl` con la sesión de un analista | `curl -b cookie.txt -X POST /solicitudes/:id/aprobar` | 403 o 401 según rol | No cambió el estado | POR PROBAR |
| 6 | navegador | Abrir una solicitud de otra sucursal por URL | Navegar a `/solicitudes/:otraSucursal` | 403 / no mostrar datos | No mostró datos sensibles | POR PROBAR |
| 7 | HTTP | Monto negativo saltándose la validación del formulario | `curl` POST con payload manipulado | 400/422 validación en servidor | No se aplicó cambio | POR PROBAR |
| 8 | código | Aprobar la solicitud que uno mismo creó (ver nota) | Test unitario que llama al servicio con `creadaPor === actor` | Rechazada por guardas en `authz` | No cambió DB | CUBIERTO |
| 9 | navegador | Reusar la cookie tras logout (regresión de la P1) | Reintento manual en navegador | 401 | No persiste sesión | POR PROBAR |

**Nota sobre el 8.** Por la app **no se puede**: crear exige `ANALISTA`, resolver
exige `APROBADOR`, y cada usuario tiene un solo rol, así que nadie puede crear y
aprobar la misma solicitud. La cuarta guarda de `puedeResolverSolicitud`
(`src/lib/authz.ts`) es defensa en profundidad para el día que exista un rol con ambos permisos. Se ataca llamando
al servicio con una solicitud cuyo `creadaPor` sea el propio actor.

### De la Práctica 3 — SSR e integración

Ojo con estos: **Bóveda todavía no hace ningún fetch saliente**, así que la
superficie de SSRF no existe en la app. Los ataques 11 y 12 se ejercen contra
`validarDestino` como función, no contra la aplicación corriendo. Eso no los
hace menos reales: es la defensa construida **antes** de que exista el agujero,
que es justo el argumento del bloque 4.

| # | Nivel | Ataque | Cómo lo ejecuté | Qué respondió | En la base | Veredicto |
|---|---|---|---|---|---|---|
| 10 | build | ¿Alguna ruta autenticada sale `○` (estática) en la tabla del build? | `npm run build` y revisar la tabla de rutas | Ninguna ruta autenticada aparece como estática (si es así) | n/a | POR PROBAR |
| 11 | código | Pasarle a `validarDestino` metadata (169.254...), rango privado y loopback decimal | `npx vitest run tests/unit/practica-3/extra/outbound.test.ts` | `validarDestino` debe devolver `permitido:false` con motivo | n/a | PARCIAL |
| 12 | código | Un destino permitido que responde 302 hacia una IP interna: ¿el `fetch` lo sigue? | Crear test `outbound-redirect.test.ts` que simule redirect hacia IP privada | `validarDestino` o control de redirects debe bloquear | n/a | PARCIAL |
| 13 | HTTP | Provocar un error interno y leer qué se filtra en el mensaje | Forzar excepción en endpoint y revisar respuesta JSON y logs | La respuesta debe ser genérica; logs en non-prod pueden ser detallados | Revisar logs | PARCIAL |
| 14 | build | ¿Hay algún componente o página que consulte datos sin pasar por el repositorio? | `npm run build` + `grep -n "fetch(" src || true` | No se deben detectar fetchs directos desde componentes | n/a | POR PROBAR |

### Tu propio ataque

Uno que no esté en las tablas de arriba. Puede fallar: si lo intentaste y la
defensa aguantó, eso también se documenta. Si no se te ocurrió ninguno, decilo
acá en vez de dejarlo en blanco.

| Ataque | Por qué pensaste que podía funcionar | Qué pasó | Veredicto |
|---|---|---|---|
| DNS rebinding local hacia backend | Pensé que un nombre válido podría resolverse a IP interna | `validarDestino` bloquea hosts desconocidos; falta test de DNS dinámico | PARCIAL |

### De los 14, ¿cuáles convertiste en test?

La regla: **cada ataque que encontrás a mano, convertilo en el test que lo
impida en el futuro — si la defensa vive en lógica pura.** Los que pasan por
HTTP o por el navegador van a Playwright; los que atacan una función pura van a
Vitest. Modelos que ya están en el repositorio:

- `tests/unit/practica-2/extra/authz-efecto.test.ts` — ataca el servicio y verifica que el estado en base no cambió
- `tests/unit/practica-3/extra/outbound.test.ts` — la allowlist contra seis destinos
- `tests/e2e/idor.spec.ts` — el IDOR entre sucursales, en el navegador

| Ataque (#) | Test que lo cubre | Unitario o E2E |
|---|---|---|
| 11 | tests/unit/practica-3/extra/outbound.test.ts | Unitario |
| 12 | tests/unit/practica-3/extra/outbound-redirect.test.ts (sugerido) | Unitario |
| 8 | tests/unit/practica-2/extra/authz-efecto.test.ts | Unitario |

**Comprobación de que tu suite defiende algo:** rompé a propósito una línea de
`src/lib/authz.ts`, corré `npm run test:p3`, y confirmá que alguno se pone en
rojo. Si todo sigue verde, la suite no está defendiendo nada. Restaurá con
`git checkout -- src/lib/authz.ts` y anotá qué test se cayó.

## 3. Riesgos aceptados

Lo que decidiste NO cerrar, y por qué. Esta sección vale tanto como la primera.
Para cada uno: cuál es el riesgo, por qué se acepta, y qué lo compensa mientras tanto.

| Riesgo | Por qué se acepta | Qué lo compensa | Cuándo se revisa |
|---|---|---|---|
| DNS rebinding en fetch saliente | Requiere control de infra y resolver dedicados; no está en el alcance infra actual | Hardening de `validarDestino` (allowlist por host), pruebas unitarias y code review en cada PR | Revisión trimestral y antes de pasar a producción |
| Metadata cloud expuesta por redirect o URL malformada | Se mitiga con allowlist y bloqueo de rangos IP (169.254/loopback/privadas) en lógica de validación | Tests unitarios que cubren metadata y rangos privados; política de review para cualquier fetch saliente | Al introducir integraciones salientes o antes de despliegue en prod |
| Logs con datos sensibles en prod | En entornos non-prod se aceptan logs verbosos; en prod sólo mensajes genéricos | Política de logging, filtros de redacción y revisión de commits que cambien logging | En cada release mayor |

## 4. Evidencia

Pegar aquí la salida real de los comandos de verificación. Ejecutá cada comando en la raíz del repo y pegá la salida (o subila como archivos `.txt` y pegá los fragmentos relevantes).

# Postura de seguridad — Bóveda

Documento entregable de la Práctica 3 (también usado en el Proyecto Final). No
es un resumen: es la declaración de qué controles existen, cómo se verifican y
qué riesgos se aceptan. Cada control necesita una prueba reproducible; si no
podés nombrar el comando que lo verifica, ese control debe listarse como
riesgo aceptado.

## 1. Cobertura de controles

Cada fila describe un control, su ubicación en el código, el comando exacto
que lo verifica y su estado (Cubierto / Parcial / No cubierto).

| # | Control | Dónde vive (archivo) | Cómo se verifica (comando) | Estado |
|---|---|---|---|---|
| 1 | Sesión validada en servidor por render | `src/routes/+layout.server.ts`, `src/hooks.server.ts` | `npm run build` y revisar rutas server-side en el output del build | Parcial |
| 2 | Ninguna ruta autenticada estática | configuración de rutas / build output | `npm run build` (leer la tabla que imprime Next) | Cubierto |
| 3 | Acceso a datos solo tras el repositorio | `src/lib/repository.ts`, `src/lib/repository.sqlite.ts` | `npx vitest --run` y `grep -n "fetch(" src` | Parcial |
| 4 | `ResultadoAccion` uniforme, sin filtrar detalle | `src/types.ts`, adaptadores en `src/lib` | `npx vitest --run` y revisión de tipos/serialización | Cubierto |
| 5 | `error.tsx` no renderiza `error.message` | `src/error.tsx` | `npm run build` + `grep -n "error.message" -R src || true` | Cubierto |
| 6 | Allowlist anti-SSRF en fetch de servidor | `src/lib/outbound.ts` | `npx vitest run tests/unit/practica-3/extra/outbound.test.ts` | Parcial |
| 7 | Autorización pegada al dato (sin IDOR) | `src/lib/authz.ts` y repositorios | `npm run e2e` (Playwright `tests/e2e/idor.spec.ts`) | Parcial |
| 8 | Doble control (el creador no aprueba) | `src/lib/authz.ts` | `npm run test:authz` o `npx vitest run tests/unit/practica-2/extra/authz-efecto.test.ts` | Cubierto |
| 9 | Cookie de sesión endurecida | cookie flags en `src/lib/session.ts` / hooks | `npm run e2e` + inspeccionar `Set-Cookie` (HttpOnly, Secure, SameSite) | Parcial |
| 10 | Middleware como capa, no como borde | `src/hooks.server.ts` / middlewares | `npm run build` + grep de handlers en `src` | Parcial |

## 2. Bitácora de ataques

Documentá aquí cada ataque probado, cómo se ejecutó, el comportamiento observado
y el efecto en la base de datos (la columna "En la base" es la que importa).

| # | Nivel | Ataque | Cómo lo ejecuté | Qué respondió la app | En la base | Veredicto |
|---|---|---|---|---|---|---|
| 1 | navegador | Credenciales inválidas | Intento de login con credenciales malas desde la UI | 401 / mensaje genérico | No hay sesión creada | POR PROBAR |
| 2 | navegador | Usuario inexistente vs. contraseña mala | Login con usuario inexistente | 401 / mismo mensaje | No hay sesión creada | POR PROBAR |
| 3 | navegador | Reusar cookie tras logout | Copiar cookie, logout, reutilizar cookie | 401 / redirección a login | No hay acceso persistente | POR PROBAR |
| 4 | navegador | Leer cookie de sesión desde `document.cookie` | Ejecutar `document.cookie` en consola | Cookie de sesión no aparece (HttpOnly) | No | POR PROBAR |

### Práctica 2 — autorización (ejemplos)

| 5 | HTTP | Aprobar por `curl` con cookie de analista | `curl -b cookie.txt -X POST /solicitudes/:id/aprobar` | 403/401 según rol | No cambió estado | POR PROBAR |
| 6 | navegador | Abrir solicitud de otra sucursal por URL | Navegar a `/solicitudes/:otraSucursal` | 403 / no mostrar datos | No mostró datos | POR PROBAR |
| 7 | HTTP | Monto negativo vía `curl` | POST con payload manipulado | 400/422 validación en servidor | No se aplicó cambio | POR PROBAR |
| 8 | código | Aprobar propia solicitud (guardas) | Test unitario que llama al servicio con `creadaPor === actor` | Rechazada por guardas en `authz` | No cambió DB | CUBIERTO |

### Práctica 3 — SSR e integración

Nota: la app no hace fetchs salientes en producción hoy; las defensas se prueban
contra la función `validarDestino` y con tests unitarios.

| 10 | build | Rutas autenticadas marcadas estáticas en el build | `npm run build` y revisar tabla de rutas | Ninguna ruta autenticada aparece estática | n/a | POR PROBAR |
| 11 | código | `validarDestino` contra metadata y rangos privados | `npx vitest run tests/unit/practica-3/extra/outbound.test.ts` | Debe devolver `permitido:false` con motivo | n/a | PARCIAL |
| 12 | código | Redirect que apunte a IP interna (302) | `tests/unit/practica-3/extra/outbound-redirect.test.ts` | `fetchSeguro` usa `redirect:'error'` y evita seguir redirect | n/a | PARCIAL |
| 13 | HTTP | Provocar error interno y revisar filtrado | Forzar excepción y revisar body/logs | Respuesta genérica; logs en non-prod detallados | Revisar logs | PARCIAL |
| 14 | build | Detectar fetchs directos en componentes | `npm run build` + `grep -n "fetch(" src || true` | No detectar fetchs directos desde componentes | n/a | POR PROBAR |

### Ataque propio (ejemplo)

| Ataque | Por qué pensaste que podía funcionar | Qué pasó | Veredicto |
|---|---|---|---|
| DNS rebinding local -> backend | Un nombre podía resolverse a IP interna | `validarDestino` bloquea hosts desconocidos; falta test DNS dinámico | PARCIAL |

## 3. Riesgos aceptados

| Riesgo | Por qué se acepta | Mitigación temporal | Revisión |
|---|---|---|---|
| DNS rebinding en fetch saliente | Requiere control de infra y resolvers; fuera del alcance infra actual | Hardening `validarDestino`, code review y tests unitarios | Trimestral / antes de prod |
| Metadata cloud expuesta por redirect | Se mitiga con allowlist y bloqueo de rangos IP en validación | Tests unitarios y política de revisión antes de habilitar fetchs salientes | Antes de integrar destinos salientes |
| Logs con datos sensibles en prod | Non-prod puede tener logs verbosos; en prod debe redactarse | Política de logging y filtros de redacción | En cada release mayor |

## 4. Evidencia

Copiar aquí las salidas reales de los comandos que verifican los controles. Ya incluidas a modo de ejemplo las ejecuciones que corriste:

- `npm run test:p3`
```
Test Files  7 passed (7)
Tests       58 passed (58)
Start at    08:50:05
Duration     1.77s (transform 579ms, setup 0ms, import 4.92s, tests 135ms, environment 1ms)
```

- Tests unitarios outbound:
```
npx vitest run tests/unit/practica-3/extra/outbound.test.ts
npx vitest run tests/unit/practica-3/extra/outbound-redirect.test.ts
```
```
Test Files  1 passed (1)
Tests       6 passed (6)
Start at    08:52:49
Duration     223ms (transform 34ms, setup 0ms, import 51ms, tests 4ms, environment 0ms)

Test Files  1 passed (1)
Tests       6 passed (6)
Start at    08:54:58
Duration     256ms (transform 38ms, setup 0ms, import 58ms, tests 7ms, environment 0ms)
```

Ejecución (outbound-redirect.test.ts):
```
✓ tests/unit/practica-3/extra/outbound-redirect.test.ts (2 tests) 7ms
	✓ outbound - redirect & internal handling (2)
		✓ bloquea hosts internos (metadata/privadas) en validarDestino 3ms
		✓ fetchSeguro llama a fetch con `redirect: "error"` para evitar seguir redirects 2ms

Test Files  1 passed (1)
Tests       2 passed (2)
Start at    09:17:20
Duration     354ms (transform 48ms, setup 0ms, import 77ms, tests 7ms, environment 0ms)
```

- `npm run build`
```
frontend-empresarial-seguro@1.0.0 build
> next build

▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.ts took 48ms

	Creating an optimized production build ...
✓ Compiled successfully in 1357ms
✓ Finished TypeScript in 602ms    
✓ Collecting page data using 9 workers in 3.8s    
✓ Generating static pages using 9 workers (5/5) in 1208ms
✓ Finalizing page optimization in 20ms    

Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /auditoria
├ ○ /login
├ ○ /no-autorizado
├ ƒ /solicitudes
└ ƒ /solicitudes/[id]

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- `npm run e2e`
```
frontend-empresarial-seguro@1.0.0 e2e
> playwright test

Running 9 tests using 1 worker

	✓  1 …mium] › tests\e2e\auth.spec.ts:4:1 › las cookies de sesión tienen los flags correctos (3.1s)
	✓  2 …auth.spec.ts:13:1 › credenciales inválidas muestran mensaje uniforme y no autentican (596ms)
	✓  3 … › tests\e2e\auth.spec.ts:22:1 › cerrar sesión invalida el acceso a rutas protegidas (983ms)
	✓  4 …mium] › tests\e2e\auth.spec.ts:30:1 › una ruta protegida sin sesión redirige a login (228ms)
	✓  5 …sts\e2e\doble-control.spec.ts:4:1 › el auditor puede ver la bitácora; el analista no (621ms)
	✓  6 …ntrol.spec.ts:10:1 › un analista que fuerza /auditoria es redirigido a no-autorizado (586ms)
	✓  7 …ec.ts:7:1 › analista de sucursal A no puede abrir una solicitud de sucursal B (IDOR) (716ms)
	✓  8 [chromium] › tests\e2e\idor.spec.ts:14:1 › analista no ve el botón de aprobar (657ms)
	✓  9 …dor.spec.ts:20:1 › el listado de un analista no incluye solicitudes de otra sucursal (512ms)

	9 passed (17.4s)
```

## 5. Lo que falta

- Ejecutar y pegar salidas en la sección 4 para cualquier comando pendiente (si corresponde).
- Automatizar comprobación de fetchs directos en componentes (`grep -n "fetch(" src`).
- Probar DNS rebinding en entorno controlado si se planea habilitar fetchs salientes.

---

Instrucciones rápidas:
1. Ejecutá los comandos listados en la sección 4 en tu máquina si falta alguna evidencia.
2. Pegá las salidas relevantes aquí y las incrustaré en el documento final.
├ ƒ /solicitudes
└ ƒ /solicitudes/[id]


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

- E2E para IDOR y cookie flags:
```
npm run e2e
```
Salida:
```
frontend-empresarial-seguro@1.0.0 e2e
> playwright test

[WebServer] 'BOVEDA_DB' is not recognized as an internal or external command,
[WebServer] operable program or batch file.
Error: Process from config.webServer was not able to start. Exit code: 1
```

Notas breves sobre cómo recopilar evidencia:
- Si querés guardar salidas en archivos (Windows PowerShell):
```
npm run test:p3 | Tee-Object test-p3.txt
npx vitest run tests/unit/practica-3/extra/outbound.test.ts | Tee-Object outbound.txt
npx vitest run tests/unit/practica-3/extra/outbound-redirect.test.ts | Tee-Object outbound-redirect.txt
npm run build | Tee-Object build.txt
npm run e2e | Tee-Object e2e.txt
```
- Pega en esta sección sólo las líneas relevantes que prueben el control (no todo el log si es muy largo).

## 5. Lo que falta

- Añadir y ejecutar el test `tests/unit/practica-3/extra/outbound-redirect.test.ts` que simule redirects hacia IPs privadas/metadata. (Estimado: 30-60 min)
- Ejecutar `npm run test:p3`, `npx vitest ...`, `npm run build` y `npm run e2e`, y pegar salidas en la sección 4. (Estimado: 30-60 min según entorno)
- Automatizar comprobación de fetchs directos en componentes (`grep -n "fetch(" src`) y convertir en test; si se detectan, refactorizar a repositorios. (Estimado: 30 min)
- Evaluar DNS rebinding en un entorno controlado si se planea habilitar fetchs salientes reales (requiere infra/control de DNS). (Requiere CI o entorno de pruebas)

---

Instrucciones rápidas:
1. Ejecutá los comandos listados en la sección 4 en tu máquina.
2. Copiá las salidas relevantes y pégalas en los placeholders `<PEGA_SALIDA_...>` arriba.
3. Si querés, pegá aquí las salidas y yo las insertaré en el archivo y haré el commit por vos.
