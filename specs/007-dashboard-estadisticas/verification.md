# Verificación — Dashboard de estadísticas (007)

Actualizado el 2026-10-28 con las clarificaciones de la sesión: universo de los desgloses, base cero
por fila, fecha visible junto al total y orden estable. Se mantiene la clarificación del 2026-10-27
sobre la fecha por defecto y la distinción entre error de red y error del servidor.

## Resultado de las suites

- Backend: **76 ficheros, 318 pruebas**, todas correctas.
- Frontend: **43 ficheros, 153 pruebas**, todas correctas.
- ESLint backend y frontend: correcto.
- Build de producción del frontend: correcto (aviso no bloqueante de tamaño de chunk).

## Escenario E11 — cerrar una cuenta hoy

Evidencia:

- `backend/tests/unit/reporting_fecha.test.js` → la fecha por defecto ignora las cuentas cerradas
  hoy, devuelve el día natural anterior e interpreta los cierres de madrugada en Europe/Madrid
  (también con `TZ=UTC`).
- `backend/tests/contract/reports_daily.test.js` → con una cuenta de ayer y otra de hoy, la
  consulta sin `date` devuelve ayer.
- `backend/tests/integration/reporting_fecha.test.js` → cerrar una cuenta hoy y consultar
  `/api/reports/daily` sin fecha devuelve `200` con el día anterior; `?date=hoy` devuelve `400`.
- `frontend/tests/components/dashboard_total.test.jsx` → un `400` del servidor muestra el mensaje
  real y no «sin conexión»; un fallo de red sí muestra «sin conexión».

## Escenarios E10, E12 y E13 — clarificación 2026-10-28

- **E10. Día anterior sin ventas (total y por fila).**
  - `backend/tests/contract/reports_comparison.test.js` → con el día anterior sin ventas,
    `comparacion.sinBaseComparacion = true`, `diferenciaPorcentaje = null`; cada fila de
    `porCamarero` y `porPlato` expone `importeActual`, `importeAnterior`,
    `diferenciaPorcentaje = null` y `sinBaseComparacion = true`.
  - `frontend/tests/components/dashboard_comparison.test.jsx` → el total y cada fila muestran la
    diferencia en euros con «sin base de comparación» y ningún porcentaje.
- **E12. Universo de los desgloses sin ventas.**
  - `backend/tests/contract/reports_breakdowns.test.js` → incluye a todos los usuarios con rol
    `camarero` y a todos los platos de la carta vigente (activos y sin ingredientes agotados)
    aunque no vendan (`0,00 €`, `0` unidades); excluye platos inactivos o agotados sin ventas;
    conserva las ventas de un plato ya retirado de la carta; la suma de `porPlato` coincide con el
    total.
  - `frontend/tests/components/dashboard_breakdowns.test.jsx` → las filas sin ventas aparecen con
    `0,00 €` y se respeta el orden recibido.
- **E13. Fecha visible y orden.**
  - `frontend/tests/components/dashboard_total.test.jsx` → la fecha del día consultado se muestra
    junto al total en formato español.
  - `backend/tests/contract/reports_breakdowns.test.js` y
    `frontend/tests/components/dashboard_breakdowns.test.jsx` → orden por importe descendente y, a
    igualdad, por nombre.

## Comparación y desgloses

- `backend/tests/contract/reports_comparison.test.js` comprueba `diaAnterior = null`, la comparación por camarero y la ausencia de comparación cuando no hay día anterior.
- `backend/tests/contract/reports_breakdowns.test.js` comprueba camareros/platos con cero ventas, la vinculación por `cuentas.pedido_id` y que dos cuentas de la misma mesa no duplican consumos.
- `frontend/tests/components/dashboard_comparison.test.jsx` comprueba las tablas de diferencia por camarero/plato y el aviso «sin datos anteriores».
- `frontend/tests/components/dashboard_breakdowns.test.jsx` comprueba filas de camarero/plato con `0,00 €`.

## Escenarios E1–E13

Se mantienen cubiertos por:

- `backend/tests/contract/reports_daily.test.js`
- `backend/tests/contract/reports_breakdowns.test.js`
- `backend/tests/contract/reports_comparison.test.js`
- `backend/tests/integration/reporting_zero_base.test.js`
- `backend/tests/unit/reporting_total.test.js`
- `backend/tests/unit/reporting_breakdowns.test.js`
- `backend/tests/unit/reporting_comparison.test.js`
- `frontend/tests/components/dashboard_total.test.jsx`
- `frontend/tests/components/dashboard_breakdowns.test.jsx`
- `frontend/tests/components/dashboard_comparison.test.jsx`
- `frontend/tests/components/dashboard_comparison_zero_base.test.jsx`

## Comprobaciones manuales

- El dashboard sin `date` muestra el último día natural completado anterior a hoy.
- Las cuentas cerradas hoy no se muestran hasta que termine el día.
- Un `date` explícito de hoy o futuro devuelve `400`.
- El backend requiere sesión y rol `encargado`.
- Un error `400/500` no se presenta como «sin conexión».
