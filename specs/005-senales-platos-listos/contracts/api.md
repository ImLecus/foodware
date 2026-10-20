# Phase 1 — Contracts: API de sala (historia 005)

Interfaz entre la vista del camarero (frontend) y el backend ExpressJS. El frontend pide
una instantánea por HTTP y recibe los cambios en vivo por Server-Sent Events (SSE).

Base de la API: `/api/sala`. Formatos en JSON UTF-8 (fechas ISO 8601 UTC). Todos los textos
visibles van en español de España (el backend no los compone; envía datos).

## 1. `GET /api/sala/mesas`

Devuelve la instantánea de las **mesas abiertas** con sus platos y avisos. Se usa al cargar
y al reconectar (FR-014).

**Respuesta 200**

```json
{
  "generadoEn": "2026-10-13T12:34:56.789Z",
  "mesas": [
    {
      "id": 12,
      "numero": "12",
      "abierta": true,
      "completa": false,
      "platos": [
        { "id": 301, "nombre": "Ensaladilla", "cantidad": 2, "partida": "entrantes", "estado": "listo", "marcadoEn": "2026-10-13T12:30:00.000Z" },
        { "id": 302, "nombre": "Solomillo", "cantidad": 1, "partida": "principales", "estado": "pendiente", "marcadoEn": null }
      ],
      "aviso": null
    }
  ]
}
```

**Reglas**:
- `mesas` puede ser `[]` (la vista muestra "No hay mesas abiertas", FR-015).
- `aviso` es `null` o `{ "id": 55, "estado": "activo" | "descartado", "generadoEn": "..." }`.
- Los platos aparecen agrupados por `partida` en el orden entrantes → principales → postres.

**Errores**: `500` si falla el acceso a datos (la vista muestra el estado "sin conexión /
no actualizado").

## 2. `GET /api/sala/eventos` (SSE)

Canal `text/event-stream`. Tras abrirlo, el cliente mantiene la vista al día **sin recargar**
(FR-004, FR-012). El servidor emite un *heartbeat* cada 15 s (comentario `: ping`) para
detectar conexiones muertas.

**Eventos emitidos**

| `event` | `data` | Cuándo |
|---------|--------|--------|
| `plato-estado` | `{ "mesaId": 12, "platoId": 302, "estado": "listo", "marcadoEn": "..." }` | Cocina marca/deshace un plato |
| `aviso-activo` | `{ "avisoId": 55, "mesaId": 12, "generadoEn": "..." }` | Una mesa abierta pasa a completa |
| `aviso-retirado` | `{ "mesaId": 12 }` | Un plato vuelve a `pendiente` y la mesa deja de estar completa |
| `aviso-descartado` | `{ "avisoId": 55, "mesaId": 12, "descartadoEn": "..." }` | Cualquier camarero descarta el aviso; se difunde a **todos** los clientes conectados (descarte global, SC-009) |

**Ejemplo**

```text
event: plato-estado
data: {"mesaId":12,"platoId":302,"estado":"listo","marcadoEn":"2026-10-13T12:35:10.000Z"}

event: aviso-activo
data: {"avisoId":55,"mesaId":12,"generadoEn":"2026-10-13T12:35:10.100Z"}
```

**Reconexión**: `EventSource` se reconecta solo; al reconectar, el cliente vuelve a pedir
`GET /api/sala/mesas` para descartar eventos perdidos y quedar al día (≤ 10 s, SC-008).

## 3. `POST /api/sala/avisos/{avisoId}/descartar`

Registra el descarte del aviso por parte del camarero (FR-009, FR-010). El descarte es
**global**: cambia el estado del aviso para toda la sala y el aviso deja de mostrarse en
todas las pantallas de camarero (SC-009).

**Respuesta 200**

```json
{ "avisoId": 55, "mesaId": 12, "estado": "descartado", "descartadoEn": "2026-10-13T12:36:00.000Z" }
```

**Reglas y errores**:
- Idempotente: si el aviso ya estaba `descartado`, devuelve `200` sin cambiar `descartadoEn`.
- `404` si el aviso no existe.
- `500` si falla el acceso a datos; la vista muestra el estado "sin conexión / no
  actualizado" y reintenta al recuperar la conexión.
- Sin conexión, la vista **no envía** la petición y deshabilita la acción, mostrando el
  indicador de "sin conexión" (FR-014).
- Al descartar, el backend emite `aviso-descartado` por SSE a **todos** los clientes del
  hub compartido, incluida la pantalla que originó la acción, para que todas converjan al
  mismo estado en ≤ 5 s (SC-009). La pantalla que descarta puede actualizar su vista al
  recibir la respuesta `200`, pero el evento es la fuente de verdad para el resto.

## 4. Semántica de "sin conexión"

La vista muestra el indicador "sin conexión" y marca la información como no actualizada
cuando:
- falla `GET /api/sala/mesas`, o
- el canal SSE se cierra y no puede reabrirse.

Mientras dure, **no se permite descartar avisos** ni confirmar cambios. Al recuperarse la
conexión, se refresca la instantánea y se reanuda el SSE (FR-014, SC-008).
