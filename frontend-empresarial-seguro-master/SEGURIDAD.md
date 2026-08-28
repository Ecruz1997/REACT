# Seguridad de la sesion - Boveda

Documento entregable de la Practica 1. Maximo una pagina. No describas el codigo:
explica las decisiones. Si una respuesta te sale "porque asi venia", esa es
justamente la que hay que pensar.

## 1. Que se guarda, donde y por que

| Dato | Donde vive | Por que ahi | Que pasaria si viviera en localStorage |
|---|---|---|---|
| Access token | | | |
| Refresh token | | | |
| Rol del usuario | | | |
| Secreto de firma | | | |

## 2. Los atributos de la cookie

Uno por fila. En "Que ataque cierra" no vale repetir el nombre del atributo.

| Atributo | Valor en Boveda | Que ataque cierra |
|---|---|---|
| `httpOnly` | | |
| `Secure` | | |
| `SameSite` | | |
| `maxAge` | | |

## 3. Sesion revocable

Un JWT valido no se puede apagar antes de que expire. Boveda lo resuelve
respaldando el token con un registro de sesion en base.

- Que verifica `verificarSesion()` ademas de la firma:
- Por que borrar la cookie en el logout NO alcanza:
- Como lo demostraste (los pasos exactos):

## 4. Rotacion y reuso  (seccion de la Tarea 1)

El escenario: a alguien le roban el refresh token.

- **Sin rotacion**, que puede hacer el atacante y por cuanto tiempo:
- **Con rotacion**, que pasa la primera vez que uno de los dos lo usa:
- Por que se revoca la sesion **entera** y no solo el token presentado:
- Que quedo en la bitacora, con el motivo exacto:

## 5. Evidencia

```
npm run test:p1  ->
```

Y la demostracion del robo simulado: que hiciste, que respondio la app, y que
quedo en base. El estado en base es lo que prueba la defensa, no el mensaje.

---

Completo: respuestas basadas en la implementación del proyecto.

## 1. Que se guarda, donde y por que

| Dato | Donde vive | Por que ahi | Que pasaria si viviera en localStorage |
|---|---|---|---|
| Access token | Cookie `boveda_access` con `httpOnly` | Vida corta, se envía automáticamente en cada request; no debe ser accesible desde JS | Un XSS podría leerlo y usarlo para solicitar recursos hasta que caduque |
| Refresh token | Cookie `boveda_refresh` con `httpOnly` | Vida más larga; solo se usa para renovar/rotar access tokens; protegido de XSS por `httpOnly` | Si está en localStorage un XSS permite exfiltrar el refresh y mantener acceso prolongado |
| Rol del usuario | Dentro del payload del JWT (`tipo`, `rol`, `sucursalId`) y usado por el servidor | Permite autorización sin consultar DB en cada request (pero la sesión sigue verificada) | Si se pusiera en localStorage sería igualmente expuesto a XSS y podría manipularse en el cliente |
| Secreto de firma | Variable de entorno `SESSION_SECRET` en el servidor | Nunca sale del servidor; necesario para firmar/verificar JWT | Si se filtrara (o se pusiera en cliente) un atacante podría firmar tokens válidos |

## 2. Los atributos de la cookie

| Atributo | Valor en Boveda | Que ataque cierra |
|---|---|---|
| `httpOnly` | `true` | Impide que scripts en la página (XSS) lean tokens y los exfiltren |
| `Secure` | `process.env.NODE_ENV === 'production'` (true en prod) | Evita enviar cookies por HTTP no cifrado; reduce posibilidad de intercepción en redes inseguras |
| `SameSite` | `lax` | Reduce CSRF al evitar que navegaciones cross-site envíen automáticamente cookies en solicitudes peligrosas |
| `maxAge` | `ACCESS_TTL_SEGUNDOS` / `REFRESH_TTL_SEGUNDOS` | Limita ventana temporal de uso; si un token es robado, su utilidad expira rápido |

## 3. Sesion revocable

- Que verifica `verificarSesion()` ademas de la firma:
	- Verifica que el token sea de tipo `access` y que la firma y expiración sean válidas.
	- Consulta la sesión en el repositorio (`repo().buscarSesion`) y comprueba que `revocadaEn` sea `null`.
	- Actualiza `ultimoAccesoEn` con `tocarSesion()` si todo está bien.
- Por que borrar la cookie en el logout NO alcanza:
	- Borrar la cookie sólo elimina el token del navegador, pero si el atacante ya tenía una copia válida del token, puede seguir usándola hasta que expire a menos que la sesión se marque como revocada en el servidor. Por eso se mantiene un registro de sesión revocable en la DB y `destruirSesion()` llama a `revocarSesion()`.
- Como lo demostraste (los pasos exactos):
	1. Crear sesión en el repositorio (`crearSesion`) y firmar un `refresh` inicial (así lo hace el test).
	2. Llamar a `rotarRefresh()` con el refresh legítimo → emite un nuevo refresh y actualiza `refreshActual` en la sesión.
	3. Simular que el atacante presenta el refresh antiguo: llamar `rotarRefresh()` otra vez con el viejo → detecta reuso y ejecuta `revocarSesion()`.
	4. Verificar en el repositorio que `buscarSesion(sesionId).revocadaEn` ya no es `null`.

## 4. Rotacion y reuso

- Sin rotacion, que puede hacer el atacante y por cuanto tiempo:
	- Si el atacante obtiene un refresh token, puede pedir access tokens repetidamente hasta que el refresh expire (hasta `REFRESH_TTL_SEGUNDOS`, 8h en esta implementación).
- Con rotacion, que pasa la primera vez que uno de los dos lo usa:
	- En uso legítimo el servidor rota el refresh: se crea un nuevo `refreshId` y el anterior deja de ser `refreshActual`.
	- Si un atacante presenta el refresh antiguo (ya rotado), el servidor detecta que `p.refreshId !== sesion.refreshActual` y trata eso como reuso (señal de robo).
- Por que se revoca la sesion **entera** y no solo el token presentado:
	- Reuso indica que el token anterior fue copiado y puede haber múltiples instancias (atacante + legítimo). Revocar toda la sesión elimina todas las credenciales asociadas (access + refresh nuevos) y evita que el atacante siga renovando tokens.
- Que quedo en la bitacora, con el motivo exacto:
	- Se registra un evento `ACCESO_DENEGADO` con `metadatos.motivo === 'reuso_de_refresh'`.

## 5. Evidencia

Ejecuté los tests que reproducen el flujo y las defensas:

```bash
npm run test:p1
```

Salida completa del comando (ejecución local en el proyecto):

```text
> frontend-empresarial-seguro@1.0.0 test:p1
> vitest run tests/unit/refresh.test.ts tests/unit/tokens.test.ts


 RUN  v4.1.10 C:/Users/evera/Ago-RECAT/REACT/frontend-empresarial-seguro-master

 ✓ tests/unit/tokens.test.ts (7 tests) 24ms
 ✓ tests/unit/refresh.test.ts (5 tests) 24ms

 Test Files  2 passed (2)
		Tests  12 passed (12)
	Start at  22:35:40
	Duration  438ms (transform 126ms, setup 0ms, import 301ms, tests 48ms, environment 0ms)
```

Qué hice (resumen de la prueba):
- Rote un refresh legítimo (uso correcto) -> se emitió un `nuevoRefresh`.
- Presenté el refresh anterior (simulación de robo) -> `rotarRefresh()` devolvió `reuseDetectado: true` y la sesión fue revocada.

Qué quedó en la base (prueba final):
- `buscarSesion(sesionId).revocadaEn` contiene una fecha (la sesión está revocada).
- `listarAuditoria()` contiene un registro con `metadatos.motivo === 'reuso_de_refresh'`.

Esto demuestra que la rotación + verificación en DB revoca la sesión y deja evidencia persistente en auditoría.
