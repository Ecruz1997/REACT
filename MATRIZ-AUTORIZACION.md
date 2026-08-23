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

1. 
2. 
3. 
4. 
5. 
