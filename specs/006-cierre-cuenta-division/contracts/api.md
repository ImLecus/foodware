# Phase 1 — Contracts: API de cierre de cuenta (historia 006)

Interfaz entre la pantalla de cierre (frontend) y el backend ExpressJS. El flujo es de
petición/respuesta por HTTP; la única integración en vivo es el evento que avisa a la vista de
sala al cerrar la mesa (hub SSE de la historia 005).

Base de la API: `/api/sala`. Formatos en JSON UTF-8 (fechas ISO 8601 UTC; importes en
céntimos enteros). Todos los textos visibles van en español de España (el backend no los
compone; envía datos y códigos).

## 0. Dependencias con otras historias

- **Historia 005 (sala)**: `GET /api/sala/mesas` para localizar la mesa y el hub SSE
  `GET /api/sala/eventos` (esta historia solo **emite** en él, ver §4).
- **Historias 01–04**: aportan la mesa y sus consumos con el precio fijado al pedir; aquí
  solo se leen.

## 1. `GET /api/sala/mesas/{mesaId}/cuenta`

Devuelve la **cuenta abierta** de la mesa (total calculado y consumos) antes de confirmar.
Se usa al abrir la pantalla de cierre y tras rechazarse un cierre por cambio de cuenta
(FR-017).

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
  ]
}
```

**Reglas y errores**:
- `totalCent` es la suma de `importeCent` de los consumos (céntimos).
- `consumos` puede ser `[]`; en ese caso `totalCent = 0` y no se permite cerrar (edge case).
- `404` si la mesa no existe.
- `409` si la cuenta ya está cerrada (FR-014).

## 2. `POST /api/sala/mesas/{mesaId}/cuenta/cierre`

Confirma el cobro y cierra la cuenta y la mesa en una única operación. Si hay división, el
cuerpo incluye todas las partes (todas pagadas). El cierre es idempotente en su rechazo:
repetirlo devuelve `409`.

**Cuerpo (modo único, sin división)**

```json
{ "modo": "unico", "totalBaseCent": 4250 }
```

**Cuerpo (división)**

```json
{
  "modo": "iguales",
  "totalBaseCent": 4250,
  "partes": [
    { "orden": 1, "comensal": "Ana", "importeCent": 1417, "pagada": true },
    { "orden": 2, "comensal": "Luis", "importeCent": 1417, "pagada": true },
    { "orden": 3, "comensal": "Marta", "importeCent": 1416, "pagada": true }
  ]
}
```

```json
{
  "modo": "por_consumo",
  "totalBaseCent": 4250,
  "partes": [
    { "orden": 1, "comensal": "Ana", "importeCent": 1700, "pagada": true },
    { "orden": 2, "comensal": "Luis", "importeCent": 2550, "pagada": true }
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
  "cuenta": { "id": 88, "mesaId": 12, "estado": "cerrada", "totalCent": 4250, "cerradaEn": "2026-10-13T21:05:00.000Z" },
  "ticket": {
    "mesaId": 12,
    "numero": "12",
    "totalCent": 4250,
    "generadoEn": "2026-10-13T21:05:00.000Z",
    "partes": [
      { "orden": 1, "comensal": "Ana", "importeCent": 1417 },
      { "orden": 2, "comensal": "Luis", "importeCent": 1417 },
      { "orden": 3, "comensal": "Marta", "importeCent": 1416 }
    ]
  }
}
```

**Reglas y errores**:
- `400` si el cuerpo no es válido (modo desconocido, partes ausentes cuando el modo es dividido).
- `404` si la mesa no existe.
- `409` si la cuenta ya está cerrada (FR-014) o la mesa ya no está abierta (FR-012).
- `422` si `totalBaseCent` no coincide con el total actual (la cuenta cambió; la división debe
  rehacerse, FR-017).
- `422` si `Σ partes.importeCent ≠ totalCent` (FR-009), o si en `por_consumo` las asignaciones
  no cubren exactamente cada consumo.
- `422` si alguna parte tiene `pagada = false` (no se cierra hasta que todas estén pagadas,
  FR-016); `modo = "unico"` equivale a una sola parte ya pagada.
- `422` si el total es cero (no se permite un cierre sin importe, edge case).
- `201` si se cierra: persiste la cuenta, sus partes y asignaciones, marca la mesa como
  cerrada (FR-011) y emite `mesa-cerrada` (§4).

## 3. `GET /api/sala/mesas/{mesaId}/cuenta/ticket`

Devuelve el ticket de una cuenta **ya cerrada** (FR-010, US3). Permite volver a mostrarlo sin
volver a cerrar.

**Respuesta 200**: mismo objeto `ticket` que en la respuesta de cierre.

**Errores**:
- `404` si la mesa no existe o no tiene cuenta cerrada.
- `409` si la cuenta aún está abierta (aún no se ha confirmado el cobro).

## 4. Evento `mesa-cerrada` (hub SSE de la historia 005)

Al cerrar una cuenta, el backend emite este evento en el hub existente
`GET /api/sala/eventos` para que las pantallas de sala dejen de mostrar la mesa. No es un
canal nuevo de la historia 006: se publica en el hub de 005.

| `event` | `data` | Cuándo |
|---------|--------|--------|
| `mesa-cerrada` | `{ "mesaId": 12, "cuentaId": 88, "cerradaEn": "..." }` | Se confirma el cierre de la cuenta de una mesa |

## 5. Semántica de "sin conexión"

La pantalla de cierre muestra el indicador "sin conexión" (reutilizado de la historia 005)
cuando falla una llamada de esta API. Mientras dure, **no se permite confirmar el cierre**;
lo ya compuesto (división, partes) se conserva en pantalla hasta recuperar la conexión.
