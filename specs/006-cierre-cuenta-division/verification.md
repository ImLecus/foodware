# Verificación — Cierre y división de cuenta (006)

Actualizado el 2026-10-27 con la reutilización de mesas, la asociación cuenta–pedido y el
bloqueo por platos pendientes de cocina.

## Base de datos y seed

Con la base local recreada y el seed ejecutado:

| Tabla | Filas |
|---|---:|
| `partidas` | 3 |
| `usuarios` | 8 |
| `mesas` | 20 |
| `platos` | 8 |
| `pedidos` | 10 |
| `cuentas` | 4 |

La migración `backend/migrations/007_cuenta_pedido.sql` añade `cuentas.pedido_id`. El seed
incluye `cuenta-reutilizada`, una cuenta histórica de `mesa-9`, y `pedido-reutilizado`, una
comanda nueva con una línea pendiente de cocina.

Comando de comprobación:

```bash
cd backend
npm run seed
node --input-type=module - <<'NODE'
import { createDb } from './src/db/index.js';
const db = createDb();
for (const tabla of ['partidas', 'usuarios', 'mesas', 'platos', 'pedidos', 'cuentas']) {
  console.log(tabla, db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get().n);
}
NODE
```

## Suites automatizadas

- Backend: **71 ficheros, 303 pruebas**, todas correctas.
- Frontend: **41 ficheros, 146 pruebas**, todas correctas.
- ESLint backend y frontend: correcto.

```bash
npm --prefix backend test
npm --prefix frontend test
npm --prefix backend run lint
npm --prefix frontend run lint
```

## Escenario M — cierre bloqueado por platos pendientes

Evidencia:

- `backend/tests/integration/cierre-total.test.js` → «bloquea el cierre mientras haya platos
  pendientes en cocina».
- `backend/tests/contract/ticket-cierre.test.js` → «bloquea la última parte si quedan platos
  pendientes y permite cerrar tras cocinarlos».
- `frontend/tests/pages/CierreCuenta.test.jsx` → «muestra los platos pendientes y deshabilita
  el cierre».

Resultado: el cierre devuelve `409 platos_pendientes`, incluye el listado de platos y no modifica
la mesa ni emite ticket. Tras marcar las líneas como listas, el cierre se completa.

## Escenario N — reutilización de mesa e histórico

Evidencia:

- `backend/tests/integration/cierre-total.test.js` → «muestra el total, permite cancelar sin
  cambios y libera la mesa con un pago único»: tras cerrar se comprueba `mesa-1.estado = libre`
  y se abre una nueva comanda.
- `backend/tests/integration/division-cuenta.test.js` → «divide una comanda nueva sin mezclarla
  con la cuenta histórica de la mesa».
- `backend/tests/integration/mesa-cerrada.test.js` → «permite abrir una comanda nueva en la mesa
  liberada y rechaza escribir en la anterior».
- `backend/tests/contract/ticket-cierre.test.js` y `ticket-reversion.test.js`: ticket y bloqueo
  de la cuenta cerrada.

Resultado: la cuenta anterior queda cerrada como histórico; la mesa vuelve a `libre`; una nueva
comanda crea un pedido y una cuenta nuevos; las escrituras sobre la cuenta cerrada se rechazan.

## Observaciones

- El dashboard de la historia 007 no forma parte de esta verificación.
- La prueba manual de la interfaz se apoya en los componentes y la integración de
  `CierreCuenta`; no se requiere una base de datos distinta de la sembrada.
