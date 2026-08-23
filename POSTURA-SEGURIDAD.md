# Postura de seguridad - Boveda

Documento entregable de la Practica 3, y el mismo que pide el Proyecto Final.
No es un resumen de lo que hiciste: es la declaracion de que controlas cada
riesgo o de que lo aceptaste a sabiendas. Un riesgo aceptado y escrito es
ingenieria; un riesgo no visto es negligencia. La diferencia es este documento.

Regla para llenarlo: cada fila necesita una **prueba** que la respalde. Si no
podes nombrar el comando que la verifica, ese control no esta cubierto -- y eso
va en la seccion de riesgos aceptados, no escondido.

## 1. Cobertura de controles

Una fila por control. En "Como se verifica" va el comando exacto, no una idea.

| # | Control | Donde vive (archivo) | Como se verifica (comando) | Estado |
|---|---|---|---|---|
| 1 | Sesion validada en servidor por render | | `npm run build` (la ruta sale dinamica) | |
| 2 | Ninguna ruta autenticada estatica | | `npm run build` (leer la tabla) | |
| 3 | Acceso a datos solo tras el repositorio | | | |
| 4 | `ResultadoAccion` uniforme, sin filtrar detalle | | | |
| 5 | `error.tsx` no renderiza `error.message` | | | |
| 6 | Allowlist anti-SSRF en fetch de servidor | | `npx vitest run tests/unit/practica-3/extra/outbound.test.ts` | |
| 7 | Autorizacion pegada al dato (sin IDOR) | | `npm run e2e` | |
| 8 | Doble control (el creador no aprueba) | | `npm run test:authz` | |
| 9 | Cookie de sesion endurecida | | `npm run e2e` | |
| 10 | Middleware como capa, no como borde | | | |

Estado: `Cubierto` / `Parcial` / `No cubierto`. Si es parcial, decir que falta.

## 2. Riesgos aceptados

Lo que decidiste NO cerrar, y por que. Esta seccion vale tanto como la anterior.
Para cada uno: cual es el riesgo, por que se acepta, y que lo compensa mientras tanto.

| Riesgo | Por que se acepta | Que lo compensa | Cuando se revisa |
|---|---|---|---|
| DNS rebinding en el fetch saliente | | | |
| | | | |
| | | | |

## 3. Evidencia

Como se corrio y que dio. Pegar la salida real, no de memoria.

```
npm run test:p3    ->
npm run e2e        ->
npm run build      ->  (ninguna ruta autenticada estatica)
npm run grade      ->  (reporte por criterio)
```

Ojo con `test:p3`: arrastra p1 y p2 como regresion. Que este verde NO prueba
que hiciste el trabajo de la Practica 3 -- prueba que no rompiste lo anterior.
Lo de la Practica 3 se demuestra con el build, el E2E y los tests que escribas vos.

## 4. Lo que falta

Honestidad explicita. Que quedo sin hacer y que haria falta para cerrarlo.

-
-
