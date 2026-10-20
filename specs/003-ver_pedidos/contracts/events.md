# Contrato de eventos (SSE) — Ver pedidos pendientes en cocina

Canal unidireccional servidor→cliente (`text/event-stream`) que mantiene la vista de cocina al día
sin recargar.

## Endpoint

```text
GET /api/partidas/{partidaId}/eventos
```

Cabeceras: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
El cliente usa `EventSource` y reconecta automáticamente.

## Eventos

### `pedido.nuevo`
Se emite cuando sala envía un pedido nuevo para la partida.

```json
{ "tipo": "pedido.nuevo", "partida": "principales", "pedidoId": "p-130" }
```

### `pedido.modificado`
Se emite cuando un pedido ya enviado se edita después (historia 02). La vista muestra el aviso
«Modificado» junto al pedido, sin detallar qué platos cambiaron, y conserva el tiempo de espera y la
posición originales (FR-015, FR-018, SC-012).

```json
{ "tipo": "pedido.modificado", "partida": "principales", "pedidoId": "p-130", "modificado": true }
```

### `pedido.pendientes-cambiado`
Se emite cuando cambia el conjunto de pedidos pendientes de la partida (un pedido se completa, se
cancela/retira o se reordena), para que la vista recargue la lista ordenada.

```json
{ "tipo": "pedido.pendientes-cambiado", "partida": "principales" }
```

### `linea.actualizada`
Se emite cuando una línea cambia de estado (marcado/deshecho en cocina, historia 04), para que la
vista actualice el marcado de ese plato.

```json
{ "tipo": "linea.actualizada", "pedidoId": "p-130", "lineaId": "l-45", "estado": "listo" }
```

## Semántica

- Los eventos son notificaciones; ante un hueco de conexión el cliente vuelve a pedir la lista por
  REST, que ya llega ordenada y filtrada por partida.
- Ante desconexión, la vista muestra el indicador de «sin conexión» y marca la información como no
  actualizada hasta reconectar (edge case de conexión). El tiempo de espera de los pedidos ya
  mostrados sigue avanzando con el reloj local a partir de `enviadoEn` (FR-006, SC-003).
- La representación REST del pedido incluye `modificado`; el evento `pedido.modificado` solo avisa
  del cambio para que la vista refresque el aviso (FR-018).
- El canal de una partida solo transporta pedidos de esa partida.
