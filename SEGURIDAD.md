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
