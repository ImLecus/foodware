# Contrato de eventos (SSE) — Marcar platos como listos

Canal unidireccional servidor→cliente (`text/event-stream`) que permite a las pantallas de cocina
y de sala reflejar los cambios de estado sin recargar.

## Endpoint

```text
GET /api/partidas/{partidaId}/eventos      # pantalla de cocina de una partida
GET /api/mesas/{mesaId}/eventos            # pantalla de sala de una mesa
```

Cabeceras: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
El cliente usa `EventSource` y reconecta automáticamente.

## Eventos

### `linea.actualizada`
Se emite cuando una línea de pedido cambia de estado (marcar o deshacer).

```json
{
  "tipo": "linea.actualizada",
  "pedidoId": "p-123",
  "mesa": 7,
  "partida": "principales",
  "linea": {
    "id": "l-9",
    "nombrePlato": "Entrecot",
    "cantidad": 2,
    "estado": "listo",
    "listoEn": "2026-10-13T20:15:00Z"
  }
}
```

### `pedido.pendientes-cambiado`
Se emite cuando el conjunto de pedidos pendientes de una partida cambia (llega un pedido nuevo,
se completa uno, se reabre uno o se reordena), para que la pantalla de cocina actualice la lista y
su orden.

```json
{
  "tipo": "pedido.pendientes-cambiado",
  "partida": "principales"
}
```

### `pedido.reabierto`
Se emite cuando se deshace la marca de la última línea de un pedido completado y este vuelve a estar
pendiente, de modo que reaparece en la lista de cocina (FR-014, FR-015). La pantalla de cocina del
cocinero que usó «Deshacer» ya actualiza la lista con la respuesta REST; este evento mantiene
coherentes las demás pantallas.

```json
{
  "tipo": "pedido.reabierto",
  "pedidoId": "p-123",
  "mesa": 7,
  "partida": "principales",
  "lineaId": "l-9"
}
```

## Semántica

- Los eventos son notificaciones de cambio; el cliente puede (y debe) poder reconstruir el estado
  consultando los endpoints REST si detecta un hueco de conexión.
- Al deshacer una marca se emite `linea.actualizada` con `estado: "pendiente"` y `listoEn: null`; si
  el pedido estaba completado, se emite además `pedido.reabierto`.
- Ante una desconexión, `EventSource` reintenta; al reconectar, el cliente vuelve a pedir la lista
  vigente (FR-010, FR-011).
- Los eventos no transportan datos sensibles más allá de los operativos del servicio.
