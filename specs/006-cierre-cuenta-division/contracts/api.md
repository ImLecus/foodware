# Phase 1 — Contracts: API de cierre de cuenta (historia 006)

Interfaz entre la pantalla de cierre y el backend ExpressJS. Todas las rutas requieren sesión
válida con rol `camarero` (historia 000): cookie `HttpOnly`; sin sesión `401`, con otro rol `403`.
No se aceptan cabeceras de identidad ni parámetros de URL como identidad.

Base de la API: `/api/sala`. JSON UTF-8; fechas ISO 8601 UTC; importes en céntimos enteros y
claves en `snake_case`, coherente con las historias 001–005.

## 0. Dependencias

- **Historia 000**: autenticación por cookie y `requireRole('camarero')`.
- **Historia 005**: hub SSE `GET /api/eventos`; esta historia solo emite `mesa-cerrada`.
- **Historias 001–004**: mesas, pedidos y líneas con precio fijado al pedir; aquí solo se leen.

## 1. `GET /api/sala/mesas/{mesaId}/cuenta`

Devuelve la cuenta abierta de la comanda actual de la mesa, sus consumos, la división confirmada
si existe y los platos pendientes de cocina.

**Respuesta 200**

```json
{
  "mesa_id": "mesa-12",
  "identificador": "Mesa 12",
  "estado": "abierta",
  "pedido_id": "pedido-88",
  "total_centimos": 4250,
  "consumos": [
    {
      "linea_id": "linea-301",
      "pedido_id": "pedido-88",
      "nombre": "Ensaladilla",
      "cantidad": 2,
      "partida": "entrantes",
      "precio_centimos": 850,
      "importe_centimos": 1700,
      "estado": "listo",
      "listo_en": "2026-10-20T20:30:00.000Z"
    },
    {
      "linea_id": "linea-302",
      "pedido_id": "pedido-88",
      "nombre": "Solomillo",
      "cantidad": 1,
      "partida": "principales",
      "precio_centimos": 2550,
      "importe_centimos": 2550,
      "estado": "pendiente",
      "listo_en": null
    }
  ],
  "platos_pendientes": [
    {
      "linea_id": "linea-302",
      "nombre": "Solomillo",
      "partida": "principales",
      "estado": "pendiente"
    }
  ],
  "division": null,
  "ticket_estado": "no_emitido"
}
```

**Reglas y errores**:
- `pedido_id` identifica la comanda actual; una cuenta cerrada de una comanda anterior no se
  devuelve como cuenta abierta.
- `total_centimos` suma todos los consumos de la comanda actual.
- `platos_pendientes` contiene solo líneas de pedidos `enviada` con `estado = pendiente`.
- `division` es `null` si no se ha confirmado; si existe, incluye `modo`, `partes` y
  `asignaciones`.
- `404` si la mesa o su comanda no existen.
- `409 cuenta_cerrada` si la comanda actual ya tiene una cuenta cerrada.
- `409 platos_pendientes` no se usa en la consulta: la lista se devuelve en el cuerpo para que la
  interfaz avise antes de intentar cerrar.

## 2. `POST /api/sala/mesas/{mesaId}/cuenta/division`

Confirma la división y la deja preparada para el cobro por partes. Persiste la cuenta `abierta`,
las partes `pendiente` y las asignaciones; no cierra la mesa ni emite ticket.

**Cuerpo (partes iguales)**

```json
{
  "modo": "iguales",
  "total_base_centimos": 4250,
  "partes": [
    { "orden": 1, "comensal": "Ana", "importe_centimos": 1417 },
    { "orden": 2, "comensal": "Luis", "importe_centimos": 1417 },
    { "orden": 3, "comensal": "Marta", "importe_centimos": 1416 }
  ]
}
```

**Cuerpo (por consumo)**

```json
{
  "modo": "por_consumo",
  "total_base_centimos": 4250,
  "partes": [
    { "orden": 1, "comensal": "Ana", "importe_centimos": 1700 },
    { "orden": 2, "comensal": "Luis", "importe_centimos": 2550 }
  ],
  "asignaciones": [
    { "parte_orden": 1, "linea_id": "linea-301", "importe_centimos": 1700 },
    { "parte_orden": 2, "linea_id": "linea-302", "importe_centimos": 2550 }
  ]
}
```

**Respuesta 201**

```json
{
  "cuenta": {
    "id": "cuenta-88",
    "mesa_id": "mesa-12",
    "pedido_id": "pedido-88",
    "estado": "abierta",
    "total_centimos": 4250,
    "modo_division": "iguales",
    "ticket_estado": "no_emitido"
  },
  "division": {
    "modo": "iguales",
    "partes": [
      { "id": "parte-501", "orden": 1, "comensal": "Ana", "importe_centimos": 1417, "estado": "pendiente", "pagada_en": null }
    ],
    "asignaciones": []
  }
}
```

**Errores**:
- `400` cuerpo inválido o partes ausentes.
- `404` mesa o comanda no encontrada.
- `409 cuenta_cerrada` si ya está cerrada.
- `409 division_con_pagos` si ya existe una división con partes pagadas.
- Si existe una división con todas las partes pendientes, se sustituye por la nueva.
- `422 total_desactualizado` si el total base no coincide con el actual.
- `422 suma_partes_incorrecta` o `422 consumos_sin_cubrir` según el modo.
- `422 cuenta_vacia` si el total es cero.

## 3. `POST /api/sala/mesas/{mesaId}/cuenta/partes/{parteId}/pago`

Marca una parte como pagada. No lleva cuerpo.

**Respuesta 200 (parte intermedia)**

```json
{
  "parte": { "id": "parte-501", "orden": 1, "comensal": "Ana", "importe_centimos": 1417, "estado": "pagada", "pagada_en": "2026-10-20T21:00:00.000Z" },
  "ticket_estado": "no_emitido",
  "ticket": null,
  "mesa_abierta": true,
  "mesa_estado": "ocupada"
}
```

**Respuesta 200 (última parte, sin pendientes de cocina)**

```json
{
  "parte": { "id": "parte-503", "orden": 3, "comensal": "Marta", "importe_centimos": 1416, "estado": "pagada", "pagada_en": "2026-10-20T21:05:00.000Z" },
  "ticket_estado": "emitido",
  "ticket": {
    "estado": "emitido",
    "mesa_id": "mesa-12",
    "identificador": "Mesa 12",
    "total_centimos": 4250,
    "generado_en": "2026-10-20T21:05:00.000Z",
    "partes": [
      { "orden": 1, "comensal": "Ana", "importe_centimos": 1417 },
      { "orden": 2, "comensal": "Luis", "importe_centimos": 1417 },
      { "orden": 3, "comensal": "Marta", "importe_centimos": 1416 }
    ]
  },
  "mesa_abierta": false,
  "mesa_estado": "libre"
}
```

**Errores**:
- `404` mesa, división o parte no encontrada.
- `409 parte_pagada` si ya estaba pagada.
- `409 cuenta_cerrada` si la cuenta ya está cerrada.
- `409 platos_pendientes` si es la última parte y quedan platos pendientes de cocina; no se
  marca la parte, no se emite ticket y la cuenta sigue abierta. Cuerpo:

```json
{
  "codigo": "platos_pendientes",
  "mensaje": "Hay platos pendientes en cocina",
  "platos": [{ "linea_id": "linea-302", "nombre": "Solomillo", "partida": "principales", "estado": "pendiente" }]
}
```

- `422 total_desactualizado` si el total actual difiere del total base; se descarta la división.

## 4. `DELETE /api/sala/mesas/{mesaId}/cuenta/partes/{parteId}/pago`

Deshace el pago de una parte y la devuelve a `pendiente`, solo con la cuenta abierta.

**Respuesta 200**

```json
{
  "parte": { "id": "parte-501", "orden": 1, "comensal": "Ana", "importe_centimos": 1417, "estado": "pendiente", "pagada_en": null },
  "ticket_estado": "no_emitido",
  "ticket": null,
  "mesa_abierta": true,
  "mesa_estado": "ocupada"
}
```

**Errores**:
- `404` mesa, división o parte no encontrada.
- `409 parte_pendiente` si ya estaba pendiente.
- `409 cuenta_cerrada` si la cuenta ya se cerró.
- `422 total_desactualizado` si el total actual difiere del total base.

## 5. `POST /api/sala/mesas/{mesaId}/cuenta/cierre`

Cobra una cuenta **sin dividir**. Si hay división confirmada, debe cerrarse pagando sus partes.

**Cuerpo**

```json
{ "modo": "unico", "total_base_centimos": 4250 }
```

**Respuesta 201**

```json
{
  "cuenta": { "id": "cuenta-88", "mesa_id": "mesa-12", "pedido_id": "pedido-88", "estado": "cerrada", "total_centimos": 4250, "cerrada_en": "2026-10-20T21:05:00.000Z" },
  "ticket_estado": "emitido",
  "ticket": {
    "estado": "emitido",
    "mesa_id": "mesa-12",
    "identificador": "Mesa 12",
    "total_centimos": 4250,
    "generado_en": "2026-10-20T21:05:00.000Z",
    "partes": []
  },
  "mesa_estado": "libre"
}
```

**Errores**:
- `400` cuerpo inválido o modo distinto de `unico`.
- `404` mesa o comanda no encontrada.
- `409 cuenta_cerrada` si ya está cerrada.
- `409 cuenta_dividida` si hay división confirmada.
- `409 platos_pendientes` si hay líneas pendientes de cocina; no se ejecuta el cierre y se
  devuelve el listado de platos.
- `422 total_desactualizado` o `422 cuenta_vacia`.

## 6. `GET /api/sala/mesas/{mesaId}/cuenta/ticket`

Devuelve el ticket de la cuenta cerrada más reciente de la mesa. Si hay una comanda nueva en
curso, el ticket anterior se conserva en la base, pero esta ruta devuelve el ticket de la última
cuenta cerrada; el histórico completo por comanda queda fuera de la interfaz v1.

**Respuesta 200**: mismo objeto `ticket` que en el cierre o en la última parte.

**Errores**:
- `404` mesa no encontrada.
- `409 ticket_no_emitido` si la cuenta actual no está cerrada o el ticket aún no existe.

## 7. Evento `mesa-cerrada`

Al cerrar la cuenta, el backend publica `mesa-cerrada` en el hub existente
`GET /api/eventos` para que la sala refresque la mesa como **libre**, no para ocultarla.

| `event` | `data` | Cuándo |
|---|---|---|
| `mesa-cerrada` | `{ "mesa_id": "mesa-12", "cuenta_id": "cuenta-88", "cerrada_en": "..." }` | Pago único o última parte, sin platos pendientes |

## 8. Semántica de «sin conexión»

La pantalla muestra «sin conexión» cuando falla la red, no cuando el servidor devuelve un error
de negocio (`409`, `422`, `403`). Mientras no haya conexión no se confirma la división, no se
pagan partes y no se cierra la cuenta; lo compuesto se conserva en pantalla.
