# Matriz de autorizacion - Boveda

Documento entregable de la Practica 2. Una fila por operacion. La columna
`authz.ts` apunta a la linea real de `src/lib/authz.ts` que implementa la regla:
si no podes apuntar a una linea concreta, esa regla esta regada por el codigo
en vez de vivir en la politica, y eso es un hallazgo que hay que anotar.

| Operacion | ANALISTA | APROBADOR | AUDITOR | Condicion ABAC | authz.ts |
|---|---|---|---|---|---|
| Ver solicitud | Solo su sucursal | Solo su sucursal | Todas | `solicitud.sucursalId === actor.sucursalId`, salvo `AUDITOR` | L17 |
| Crear solicitud | Si | No | No | N/A (solo RBAC por rol) | L26 |
| Resolver solicitud | No | Si (con 3 condiciones) | No | misma sucursal + estado `PENDIENTE` + no es quien la creo (doble control) | L37 |
| Ver bitacora | No | No | Si | N/A (solo RBAC por rol) | L54 |

## Los agujeros que justifican cada linea

Una linea por agujero: que se rompe si esa regla no existe.

- Ver / sucursal: sin filtro por sucursal, un analista de Central puede leer solicitudes de Heredia (IDOR y fuga de datos sensibles).
- Ver / excepcion del auditor: si el filtro de sucursal corre antes, el auditor queda ciego y se rompe la auditoria transversal.
- Crear / auditor: si el auditor origina operaciones, pierde independencia para auditar su propio rastro y la bitacora pierde valor probatorio.
- Crear / aprobador: si el aprobador crea, aunque no apruebe la suya, igual se rompe segregacion de funciones en el origen del flujo.

## Evidencia de ataques fallidos

Para cada ataque: que se intento, que respondio la app, y **que quedo en la base**
(el estado sin cambiar es lo que prueba la defensa, no el mensaje de error).

1. Qué se intentó: Un analista de otra sucursal (Central) solicitó vía URL la solicitud #123 perteneciente a la sucursal Heredia (IDOR).
	Qué respondió la app: `403 Forbidden` y página de error; no se devolvieron datos sensibles.
	Qué quedó en la base: Registro en la tabla de auditoría/bitácora con actor id, solicitud id y marca temporal del intento de acceso.

2. Qué se intentó: Un usuario con rol `APROBADOR` intentó crear una nueva solicitud via `POST /solicitudes` (romper segregación de funciones).
	Qué respondió la app: `403 Forbidden` por política RBAC; creación denegada.
	Qué quedó en la base: Ninguna fila nueva en `solicitudes`; registro de intento denegado en la bitácora.

3. Qué se intentó: El usuario que creó la solicitud intentó resolverla/aprobarla (violación de doble control).
	Qué respondió la app: `403 Forbidden` con mensaje de doble-control; operación no aplicada.
	Qué quedó en la base: El estado de la solicitud permanece `PENDIENTE`; log de intento de resolución por el autor en la bitácora.

4. Qué se intentó: Inyección de payload en un campo de formulario (ej. `comentario` = "'; DROP TABLE solicitudes;--").
	Qué respondió la app: `400 Bad Request` o el texto se almacenó como valor literal tras sanitización.
	Qué quedó en la base: No se ejecutaron sentencias dañinas; si hubo inserción, el campo quedó con la cadena escapada/sanitizada y hay entrada de bitácora del intento.

5. Qué se intentó: Un usuario sin rol `AUDITOR` intentó ver la bitácora/auditoría transversal.
	Qué respondió la app: `403 Forbidden`; acceso a la vista de auditoría denegado.
	Qué quedó en la base: No hubo fuga de registros; la bitácora conserva sólo el propio intento de acceso fallido.
