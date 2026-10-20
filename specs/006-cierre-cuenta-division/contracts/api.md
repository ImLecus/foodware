# Phase 1 — Contracts: API de cierre de cuenta (historia 006)

Interfaz entre la pantalla de cierre (frontend) y el backend ExpressJS. El flujo es de
petición/respuesta por HTTP; la única integración en vivo es el evento que avisa a la vista de
sala al cerrar la mesa (hub SSE de la historia 005).

Base de la API: `/api/sala`. Formatos en JSON UTF-8 (fechas ISO 8601 UTC; importes en
céntimos enteros). Todos los textos visibles van en español de España (el backend no los
compone; envía datos y códigos).

## 0. Dependencias con otras historias

- **Historia 005 (sala)**: `GET /api/sala/mesas` para localizar la mesa y el hub SSE
  `GET /api/sala/eventos` (esta historia solo **emite** en él, ver §7).
- **Historias 01–04**: aportan la mesa y sus consumos con el precio fijado al pedir; aquí
  solo se leen.

## 1. `GET /api/sala/mesas/{mesaId}/cuenta`

Devuelve la **cuenta abierta** de la mesa (total calculado, consumos y, si ya se confirmó, la
división con el estado de cada parte) antes de terminar el cobro. Se usa al abrir la pantalla
de cierre y tras rechazarse una operación por cambio de cuenta (FR-017).

**Respuesta 200**

```json
{
  "mesaId": 12,
  "numero": "12",
  "estado": "abierta",
  "totalCent": 4250,
  "consumos": [
    { "id": 301, "nombre": "Ensaladilla", "cantidad": 2, "partida": "entrantes", "precioUnitarioCent": 850, "importeCent": 1700 },
    { "id": 302, "nombre": "Solomillo", "cantidad": 1, "partida": "principales", "precioUnitarioCent": 2550, "importeCent": 2550 }
  ],
  "division": null,
  "ticketEstado": "no_emitido"
}
```

**Reglas y errores**:
- `totalCent` es la suma de `importeCent` de los consumos (céntimos).
- `consumos` puede ser `[]`; en ese caso `totalCent = 0` y no se permite cerrar (edge case).
- `division` es `null` si aún no se ha confirmado ninguna división; si existe, incluye `modo`,
  `partes` (con `id`, `orden`, `comensal`, `importeCent`, `estado` y `pagadaEn`) y
  `asignaciones`.
- `ticketEstado` es `no_emitido` mientras la cuenta está abierta, aunque haya partes pagadas;
  solo pasa a `emitido` al cerrarse la cuenta (§6).
- `404` si la mesa no existe.
- `409` si la cuenta ya está cerrada (FR-014); en ese caso el ticket se consulta en §6.

## 2. `POST /api/sala/mesas/{mesaId}/cuenta/division`

Confirma la división y la deja preparada para el cobro por partes. Persiste la cuenta en
estado `abierta`, las partes en estado `pendiente` y las asignaciones; **no** cierra la mesa
ni emite ningún ticket. Es el punto de partida de los pagos individuales.

**Cuerpo (partes iguales)**

```json
{
  "modo": "iguales",
  "totalBaseCent": 4250,
  "partes": [
    { "orden": 1, "comensal": "Ana", "importeCent": 1417 },
    { "orden": 2, "comensal": "Luis", "importeCent": 1417 },
    { "orden": 3, "comensal": "Marta", "importeCent": 1416 }
  ]
}
```

**Cuerpo (por consumo)**

```json
{
  "modo": "por_consumo",
  "totalBaseCent": 4250,
  "partes": [
    { "orden": 1, "comensal": "Ana", "importeCent": 1700 },
    { "orden": 2, "comensal": "Luis", "importeCent": 2550 }
  ],
  "asignaciones": [
    { "parteOrden": 1, "consumoId": 301, "importeCent": 1700 },
    { "parteOrden": 2, "consumoId": 302, "importeCent": 2550 }
  ]
}
```

**Respuesta 201**

```json
{
  "cuenta": {
    "id": 88,
    "mesaId": 12,
    "estado": "abierta",
    "totalCent": 4250,
    "modoDivision": "iguales",
    "ticketEstado": "no_emitido"
  },
  "division": {
    "modo": "iguales",
    "partes": [
      { "id": 501, "orden": 1, "comensal": "Ana", "importeCent": 1417, "estado": "pendiente", "pagadaEn": null },
      { "id": 502, "orden": 2, "comensal": "Luis", "importeCent": 1417, "estado": "pendiente", "pagadaEn": null },
      { "id": 503, "orden": 3, "comensal": "Marta", "importeCent": 1416, "estado": "pendiente", "pagadaEn": null }
    ],
    "asignaciones": []
  }
}
```

**Reglas y errores**:
- `400` si el cuerpo no es válido (modo desconocido o partes ausentes cuando el modo es
  dividido).
- `404` si la mesa no existe.
- `409` si la mesa no está abierta, si la cuenta ya está cerrada (FR-014) o si ya existe una
  división confirmada con alguna parte pagada.
- Si ya existe una división con **todas** las partes pendientes, se sustituye por la nueva
  (permite cancelar y rehacer la división antes de cobrar); no se emite ningún ticket.
- `422` si `totalBaseCent` no coincide con el total actual (la cuenta cambió; hay que rehacer
  la división, FR-017).
- `422` si `Σ partes.importeCent ≠ totalCent` (FR-009), si en `por_consumo` las asignaciones no
  cubren exactamente cada consumo o si el total es cero (edge case).

## 3. `POST /api/sala/mesas/{mesaId}/cuenta/partes/{parteId}/pago`

Marca una parte como pagada. No lleva cuerpo. Cada llamada se valida y persiste en su propia
transacción.

**Respuesta 200 (parte intermedia)**

```json
{
  "parte": { "id": 501, "orden": 1, "comensal": "Ana", "importeCent": 1417, "estado": "pagada", "pagadaEn": "2026-10-20T21:00:00.000Z" },
  "ticketEstado": "no_emitido",
  "ticket": null,
  "mesaAbierta": true
}
```

**Respuesta 200 (última parte pendiente)**

```json
{
  "parte": { "id": 503, "orden": 3, "comensal": "Marta", "importeCent": 1416, "estado": "pagada", "pagadaEn": "2026-10-20T21:05:00.000Z" },
  "ticketEstado": "emitido",
  "ticket": {
    "estado": "emitido",
    "mesaId": 12,
    "numero": "12",
    "totalCent": 4250,
    "generadoEn": "2026-10-20T21:05:00.000Z",
    "partes": [
      { "orden": 1, "comensal": "Ana", "importeCent": 1417 },
      { "orden": 2, "comensal": "Luis", "importeCent": 1417 },
      { "orden": 3, "comensal": "Marta", "importeCent": 1416 }
    ]
  },
  "mesaAbierta": false
}
```

**Reglas y errores**:
- Mientras queden partes pendientes no se emite ticket y la mesa sigue abierta
  (`ticketEstado = no_emitido`, `ticket = null`); no hay tickets provisionales (FR-010,
  SC-008).
- Al marcar la **última** parte pendiente, la misma transacción cierra la cuenta y la mesa,
  emite el único ticket, publica `mesa-cerrada` (§7) y devuelve `mesaAbierta = false`.
- `404` si la mesa no existe, no tiene división o la parte no pertenece a esa cuenta.
- `409` si la cuenta o la mesa ya están cerradas (el ticket ya se emitió) o si la parte ya
  estaba pagada.
- `422` si el total actual de los consumos difiere del total base de la división: se descarta
  la división y el camarero debe rehacerla (FR-017).

## 4. `DELETE /api/sala/mesas/{mesaId}/cuenta/partes/{parteId}/pago`

Deshace la marca de pago de una parte y la devuelve a `pendiente`. No lleva cuerpo. Solo se
admite mientras la mesa no esté cerrada.

**Respuesta 200**

```json
{
  "parte": { "id": 501, "orden": 1, "comensal": "Ana", "importeCent": 1417, "estado": "pendiente", "pagadaEn": null },
  "ticketEstado": "no_emitido",
  "ticket": null,
  "mesaAbierta": true
}
```

**Reglas y errores**:
- La reversión limpia `pagada_en` y no emite ni invalida ningún ticket, porque todavía no
  existe: el ticket solo se genera al pagar la última parte (FR-016, SC-009).
- Tras la reversión, la mesa no se cierra hasta que la parte vuelva a estar pagada.
- `404` si la mesa no existe, no tiene división o la parte no pertenece a esa cuenta.
- `409` si la cuenta o la mesa ya están cerradas (no se puede revertir un pago con el ticket
  emitido) o si la parte ya estaba pendiente.
- `422` si el total actual de los consumos difiere del total base de la división: se descarta
  la división y el camarero debe rehacerla (FR-017).

## 5. `POST /api/sala/mesas/{mesaId}/cuenta/cierre`

Confirma el cobro de una cuenta **sin dividir** y cierra la cuenta y la mesa en una única
operación. Si la cuenta tiene una división, este endpoint se rechaza: el cierre se produce al
pagar la última parte (§3). El cierre es idempotente en su rechazo: repetirlo devuelve `409`.

**Cuerpo**

```json
{ "modo": "unico", "totalBaseCent": 4250 }
```

**Respuesta 201**

```json
{
  "cuenta": { "id": 88, "mesaId": 12, "estado": "cerrada", "totalCent": 4250, "cerradaEn": "2026-10-20T21:05:00.000Z" },
  "ticketEstado": "emitido",
  "ticket": {
    "estado": "emitido",
    "mesaId": 12,
    "numero": "12",
    "totalCent": 4250,
    "generadoEn": "2026-10-20T21:05:00.000Z",
    "partes": []
  }
}
```

**Reglas y errores**:
- `400` si el cuerpo no es válido o `modo` no es `unico`.
- `404` si la mesa no existe.
- `409` si la cuenta ya está cerrada (FR-014), si la mesa ya no está abierta (FR-012) o si la
  cuenta tiene una división confirmada (debe cerrarse pagando sus partes, §3).
- `422` si `totalBaseCent` no coincide con el total actual (la cuenta cambió; FR-017) o si el
  total es cero (no se permite un cierre sin importe, edge case).
- `201` si se cierra: persiste la cuenta, marca la mesa como cerrada (FR-011), emite el único
  ticket y publica `mesa-cerrada` (§7).

## 6. `GET /api/sala/mesas/{mesaId}/cuenta/ticket`

Devuelve el ticket de una cuenta **ya cerrada** (FR-010, US3). Permite volver a mostrarlo sin
volver a cerrar.

**Respuesta 200**: mismo objeto `ticket` que en la respuesta de cierre o de la última parte.

**Errores**:
- `404` si la mesa no existe.
- `409` si la cuenta sigue abierta o el ticket aún no se ha emitido (aunque haya partes ya
  pagadas): no existe ticket hasta la última parte. Cuerpo:
  `{ "error": "ticket_no_emitido", "ticketEstado": "no_emitido" }`.

## 7. Evento `mesa-cerrada` (hub SSE de la historia 005)

Al cerrar una cuenta, el backend emite este evento en el hub existente
`GET /api/sala/eventos` para que las pantallas de sala dejen de mostrar la mesa. No es un
canal nuevo de la historia 006: se publica en el hub de 005.

| `event` | `data` | Cuándo |
|---------|--------|--------|
| `mesa-cerrada` | `{ "mesaId": 12, "cuentaId": 88, "cerradaEn": "..." }` | Se paga la última parte pendiente de una cuenta dividida o se confirma el pago único |

## 8. Semántica de "sin conexión"

La pantalla de cierre muestra el indicador "sin conexión" (reutilizado de la historia 005)
cuando falla una llamada de esta API. Mientras dure, **no se permite confirmar la división, ni
marcar o deshacer el pago de una parte, ni confirmar el cierre**; lo ya compuesto (división,
partes) se conserva en pantalla hasta recuperar la conexión.
