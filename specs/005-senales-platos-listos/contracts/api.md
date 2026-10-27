# Phase 1 — Contracts: API de sala (historia 005)

Interfaz entre la vista del camarero (frontend) y el backend ExpressJS. El frontend pide
una instantánea por HTTP y recibe los cambios en vivo por Server-Sent Events (SSE) sobre
el **hub SSE compartido** del repositorio.

Base de la API: `/api/sala` (vista y avisos) y `/api/pedidos` (marcado de líneas). Formatos
en JSON UTF-8 (fechas ISO 8601 UTC; identificadores de texto). Todos los textos visibles van
en español de España (el backend no los compone; envía datos).

**Convención de claves JSON**: las respuestas y los cuerpos usan **`snake_case`**, igual que el
resto de la API del repositorio (`pedido_id`, `por_partida`, `plato_nombre`, `precio_centimos`).
Los nuevos campos también van en `snake_case` (`mesa_id`, `plato_id`, `aviso_id`, `generado_en`,
`descartado_en`, `marcado_en`). **Excepción**: el `data` de los eventos SSE mantiene la
convención ya usada por `realtime/emit.js` (camelCase, p. ej. `linea.actualizada` publica
`{ pedidoId, lineaId, estado }`), que se documenta literalmente abajo para no romper a los
clientes existentes.

**Convención de nombres de eventos SSE**: `punto.minuscula` (`linea.actualizada`,
`aviso.activo`, `aviso.retirado`, `aviso.descartado`), coherente con los eventos ya existentes
(`pedido.nuevo`, `pedido.modificado`).

## 1. `GET /api/sala/mesas`

Devuelve la instantánea de las **mesas abiertas** con los platos de su comanda **ya enviada
a cocina** y sus avisos. Se usa al cargar y al reconectar (FR-014). Requiere camarero
identificado (`X-Camarero-Id`).

**Respuesta 200**

```json
{
  "generado_en": "2026-10-20T12:34:56.789Z",
  "mesas": [
    {
      "id": "mesa-1",
      "identificador": "Mesa 1",
      "abierta": true,
      "completa": false,
      "platos": [
        { "id": "linea-301", "nombre": "Croquetas de jamón", "cantidad": 2, "partida": "entrantes", "estado": "listo", "marcado_en": "2026-10-20T12:30:00.000Z" },
        { "id": "linea-302", "nombre": "Paella de marisco", "cantidad": 1, "partida": "principales", "estado": "pendiente", "marcado_en": null }
      ],
      "aviso": null
    }
  ]
}
```

**Reglas**:
- `mesas` puede ser `[]` (la vista muestra "No hay mesas abiertas", FR-015).
- Incluye **todas las mesas abiertas**: las que tienen comanda en curso y las que la tienen ya
  enviada a cocina, mientras su cuenta no se haya cerrado (FR-001, FR-011). Para reunir esto por
  mesa, la consulta amplía `db/mesas.js`: parte de las mesas ocupadas y, para cada una, toma el
  pedido **enviado** (cuyas líneas se muestran) y detecta si además hay un pedido **en curso**
  (`en_curso` ⇒ mesa sin platos marcables, `completa: false`, `aviso: null`).
- Cada mesa incluye **solo** las líneas de sus pedidos ya enviados a cocina (FR-001); los
  platos sin enviar no aparecen. Una mesa con la comanda aún en curso aparece con `platos: []`,
  `completa: false` y `aviso: null` (no es marcable ni genera aviso).
- `aviso` es `null` o `{ "id": "aviso-55", "estado": "activo" | "descartado", "generado_en": "..." }`.
- Los platos aparecen agrupados por `partida` en el orden entrantes → principales → postres.
- `completa` solo es `true` si hay al menos una línea enviada y todas están `listo`.
- Tras una edición de la comanda ya enviada, el servidor recalcula la completitud al confirmarla
  (`POST /api/pedidos/{pedidoId}/enviar-cambios`, punto de integración de la historia 002) con el
  mismo criterio: los platos listos no tocados siguen `listo`, un plato nuevo entra `pendiente` y,
  si eso deja la mesa incompleta, su aviso se retira (FR-013). Si la cuenta de la mesa se cierra,
  la mesa deja de aparecer y su aviso activo se retira (FR-010; el cierre pertenece a la historia 06).

**Errores**: `401` si el camarero no está identificado; `500` si falla el acceso a datos (la
vista muestra el estado "sin conexión / no actualizado").

## 2. `GET /api/eventos` (SSE)

Canal `text/event-stream` del **hub compartido**. Tras abrirlo, el cliente mantiene la vista
al día **sin recargar** (FR-004, FR-012). El hub emite un *heartbeat* periódico (comentario
`: ping`) para detectar conexiones muertas.

**Eventos emitidos**

Los nombres de evento siguen la convención `punto.minuscula` ya existente. El `data` de
`linea.actualizada` mantiene el formato actual de `realtime/emit.js` (camelCase); los eventos
nuevos de avisos usan `snake_case` en su `data` para alinearse con los cuerpos HTTP.

| `event` | `data` | Cuándo |
|---------|--------|--------|
| `linea.actualizada` | `{ "pedidoId": "pedido-1", "lineaId": "linea-302", "estado": "listo" }` | Cocina marca/deshace un plato (evento ya existente, reutilizado) |
| `aviso.activo` | `{ "aviso_id": "aviso-55", "mesa_id": "mesa-1", "generado_en": "..." }` | Una mesa abierta pasa a completa |
| `aviso.retirado` | `{ "mesa_id": "mesa-1" }` | Un plato vuelve a `pendiente` (o una edición añade un plato pendiente) y la mesa deja de estar completa |
| `aviso.descartado` | `{ "aviso_id": "aviso-55", "mesa_id": "mesa-1", "descartado_en": "..." }` | Cualquier camarero descarta el aviso; se difunde a **todos** los clientes conectados (descarte global, SC-009) |

**Ejemplo**

```text
event: linea.actualizada
data: {"pedidoId":"pedido-1","lineaId":"linea-302","estado":"listo"}

event: aviso.activo
data: {"aviso_id":"aviso-55","mesa_id":"mesa-1","generado_en":"2026-10-20T12:35:10.100Z"}
```

**Reconexión**: `EventSource` se reconecta solo; al reconectar, el cliente vuelve a pedir
`GET /api/sala/mesas` para descartar eventos perdidos y quedar al día (≤ 10 s, SC-008).

## 3. `PUT /api/pedidos/{pedidoId}/lineas/{lineaId}/estado`

Marca o deshace la marca de una línea como lista (FR-016, mecanismo mínimo de esta historia).
Pensado también para que la historia 004 lo reutilice. Requiere camarero identificado.

**Petición**

```json
{ "estado": "listo" }
```

**Respuesta 200**

```json
{
  "linea_id": "linea-302",
  "pedido_id": "pedido-1",
  "mesa_id": "mesa-1",
  "estado": "listo",
  "marcado_en": "2026-10-20T12:35:10.000Z",
  "mesa": { "completa": false, "aviso": null }
}
```

**Reglas y errores**:
- `estado` admite `listo` o `pendiente` (validado con `zod`); cualquier otro valor → `400`.
- Solo se puede marcar una línea de un pedido **ya enviado a cocina** (`estado = 'enviada'`);
  si el pedido no está enviado → `409`.
- Idempotente: marcar como `listo` una línea que ya lo estaba devuelve `200` sin emitir un
  aviso duplicado; deshacer una línea ya `pendiente` devuelve `200` sin cambios.
- Al cambiar el estado, el backend **recalcula la completitud** de la mesa y emite por SSE
  `linea.actualizada` y, si procede, `aviso.activo` (mesa pasa a completa) o `aviso.retirado`
  (deja de estarlo).
- `404` si el pedido o la línea no existen.

## 4. `POST /api/sala/avisos/{avisoId}/descartar`

Registra el descarte del aviso por parte del camarero (FR-009, FR-010). El descarte es
**global**: cambia el estado del aviso para toda la sala y el aviso deja de mostrarse en
todas las pantallas de camarero (SC-009).

**Respuesta 200**

```json
{ "aviso_id": "aviso-55", "mesa_id": "mesa-1", "estado": "descartado", "descartado_en": "2026-10-20T12:36:00.000Z" }
```

**Reglas y errores**:
- Idempotente: si el aviso ya estaba `descartado`, devuelve `200` sin cambiar `descartado_en`.
- `404` si el aviso no existe.
- `500` si falla el acceso a datos; la vista muestra el estado "sin conexión / no
  actualizado" y reintenta al recuperar la conexión.
- Sin conexión, la vista **no envía** la petición y deshabilita la acción, mostrando el
  indicador de "sin conexión" (FR-014).
- Al descartar, el backend emite `aviso.descartado` por SSE a **todos** los clientes del
  hub compartido, incluida la pantalla que originó la acción, para que todas converjan al
  mismo estado en ≤ 5 s (SC-009). La pantalla que descarta puede actualizar su vista al
  recibir la respuesta `200`, pero el evento es la fuente de verdad para el resto.

## 5. Punto de integración de la edición: `POST /api/pedidos/{pedidoId}/enviar-cambios`

Endpoint **ya existente** de la historia 002 (confirmar los cambios de una comanda ya enviada).
La historia 005 lo **amplía** (no lo reimplementa) para que, tras marcar los cambios como
enviados y limpiar el bloqueo, **recalcule la completitud** de la mesa del pedido y emita los
eventos de sala que procedan (FR-013):

- Si la mesa deja de estar completa por un plato nuevo `pendiente` → `aviso.retirado`.
- Si la mesa pasa a estar completa (p. ej. al retirar el último plato pendiente) → `aviso.activo`.
- En ambos casos se mantiene la emisión ya existente (`pedido.modificado` / `pedido-modificado`
  en el hub) sin cambios de contrato.

**Por qué aquí y no en cada añadir/cambiar/retirar**: la edición de una comanda ya enviada solo
queda "aplicada" cuando el camarero confirma los cambios; los endpoints `POST/PATCH/DELETE
/api/pedidos/{pedidoId}/lineas/...` únicamente registran el cambio pendiente y no deben alterar
la completitud de sala. Fijar el recálculo en `enviar-cambios` evita duplicar la lógica de
completitud en tres sitios y respeta el flujo real de la historia 002.

**Errores**: los ya definidos por la historia 002 (`404` si el pedido no existe, `409` si no es
editable o no hay cambios pendientes o el bloqueo no es propio). La 005 no añade errores nuevos.

## 6. Señal sonora del aviso (contrato de interfaz, FR-006)

No es un endpoint: es el contrato de comportamiento de la vista de sala.

- La señal sonora está **activada por defecto**.
- Suena **una sola vez** al generarse el aviso de una mesa (al recibir `aviso.activo` o al
  detectar la mesa completa en la instantánea), nunca en cada render.
- Existe un control visible en la pantalla para **silenciarla y reactivarla**; su estado se
  conserva en el navegador. Silenciarla no afecta a la señal visual.

## 7. Semántica de "sin conexión"

La vista muestra el indicador "sin conexión" y marca la información como no actualizada
cuando:
- falla `GET /api/sala/mesas`, o
- el canal SSE se cierra y no puede reabrirse.

Mientras dure, **no se permite descartar avisos** ni confirmar cambios. Al recuperarse la
conexión, se refresca la instantánea y se reanuda el SSE (FR-014, SC-008).
