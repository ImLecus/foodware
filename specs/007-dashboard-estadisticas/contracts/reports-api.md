# Contrato: API de informes (`reports-api`)

Interfaz HTTP de solo lectura que consume el dashboard. Formato JSON, UTF-8.

## Autorización

- Requiere usuario autenticado con rol **`encargado`**.
- Sin autenticación → `401 Unauthorized`.
- Autenticado sin rol encargado → `403 Forbidden`.

## `GET /api/reports/daily`

Devuelve el informe diario completo (total, desglose por camarero, desglose por plato y
comparación con el día natural anterior).

### Parámetros de consulta

| Nombre | Tipo | Obligatorio | Descripción |
|--------|------|-------------|-------------|
| `date` | `YYYY-MM-DD` | No | Día natural **completado** (Europe/Madrid) a consultar. Si se omite, se usa el último día natural completado **anterior a hoy**, aunque existan cuentas cerradas hoy. No se admite el día en curso ni fechas futuras. |

Validación: si `date` no tiene formato `YYYY-MM-DD`, no es una fecha válida, es el día en curso o una fecha futura → `400`.

### Respuesta `200 OK`

```json
{
  "fecha": "2026-10-13",
  "totalVendido": 1287.50,
  "numeroCuentas": 42,
  "porCamarero": [
    { "camareroId": "c1", "nombre": "Marta", "importe": 720.00, "numeroCuentas": 24 },
    { "camareroId": "c2", "nombre": "Luis",  "importe": 567.50, "numeroCuentas": 18 }
  ],
  "porPlato": [
    { "platoId": "p1", "nombre": "Croquetas", "partida": "entrantes",   "cantidad": 30, "importe": 210.00 },
    { "platoId": "p2", "nombre": "Entrecot",  "partida": "principales", "cantidad": 12, "importe": 240.00 }
  ],
  "comparacion": {
    "diaActual": "2026-10-13",
    "diaAnterior": "2026-10-12",
    "importeActual": 1287.50,
    "importeAnterior": 1180.00,
    "diferenciaImporte": 107.50,
    "diferenciaPorcentaje": 9.11,
    "sinBaseComparacion": false,
    "tendencia": "subida",
    "porCamarero": [
      { "camareroId": "c1", "nombre": "Marta", "importeActual": 720.00, "importeAnterior": 680.00, "diferenciaImporte": 40.00, "diferenciaPorcentaje": 5.88, "sinBaseComparacion": false, "tendencia": "subida" },
      { "camareroId": "c2", "nombre": "Luis", "importeActual": 567.50, "importeAnterior": 500.00, "diferenciaImporte": 67.50, "diferenciaPorcentaje": 13.50, "sinBaseComparacion": false, "tendencia": "subida" }
    ],
    "porPlato": [
      { "platoId": "p1", "nombre": "Croquetas", "partida": "entrantes", "importeActual": 210.00, "importeAnterior": 185.00, "diferenciaImporte": 25.00, "diferenciaPorcentaje": 13.51, "sinBaseComparacion": false, "tendencia": "subida" },
      { "platoId": "p2", "nombre": "Entrecot", "partida": "principales", "importeActual": 240.00, "importeAnterior": 252.00, "diferenciaImporte": -12.00, "diferenciaPorcentaje": -4.76, "sinBaseComparacion": false, "tendencia": "bajada" }
    ]
  }
}
```

Reglas del cuerpo:
- `totalVendido` = suma de `importeTotal` de las cuentas cerradas del día.
- `porCamarero` incluye a **todos los usuarios con rol `camarero`** (no existe estado de alta/baja
  de personal en v1), hayan cerrado cuentas o no; además, conserva a cualquier camarero con ventas
  ese día aunque ya no esté activo. `importe = 0.00` y `numeroCuentas = 0` si no vendió.
- `porPlato` incluye **todos los platos de la carta vigente** (activos y con ingredientes
  disponibles, historia 008), se hayan vendido o no; además, conserva cualquier plato vendido ese
  día aunque ya no esté en la carta. `cantidad = 0` e `importe = 0.00` si no se vendió.
- `porCamarero` y `porPlato` se ordenan por `importe` descendente y, a igualdad, por `nombre`
  alfabético (FR-013).
- `comparacion.tendencia` ∈ {`subida`, `bajada`, `sin_variacion`}.
- `comparacion.sinBaseComparacion` es `true` cuando `diaAnterior` existe, `importeAnterior = 0` e
  `importeActual > 0`; en ese caso `diferenciaImporte = importeActual`,
  `diferenciaPorcentaje = null` y la UI muestra la diferencia en euros con «sin base de
  comparación», sin porcentaje (FR-011, SC-006).
- Cada fila de `comparacion.porCamarero` y `comparacion.porPlato` incluye `importeActual`,
  `importeAnterior`, `diferenciaImporte`, `diferenciaPorcentaje`, `sinBaseComparacion` y
  `tendencia`, con la misma regla de base cero aplicada fila a fila (FR-011).
- Si no hay día anterior con datos: `diaAnterior = null`, `diferenciaPorcentaje = null`,
  `sinBaseComparacion = false`, `tendencia = "sin_variacion"` y `comparacion.porCamarero` /
  `comparacion.porPlato` vacíos (la UI muestra "sin datos anteriores").
- Importes numéricos en euros (el formateo `es-ES`/€ y la fecha visible junto al total se realizan
  en la presentación, FR-012).

### Respuesta `200 OK` con día anterior sin ventas

```json
{
  "fecha": "2026-10-13",
  "totalVendido": 350.00,
  "numeroCuentas": 8,
  "porCamarero": [
    { "camareroId": "c1", "nombre": "Marta", "importe": 350.00, "numeroCuentas": 8 }
  ],
  "porPlato": [
    { "platoId": "p1", "nombre": "Croquetas", "partida": "entrantes", "cantidad": 20, "importe": 140.00 }
  ],
  "comparacion": {
    "diaActual": "2026-10-13",
    "diaAnterior": "2026-10-12",
    "importeActual": 350.00,
    "importeAnterior": 0.00,
    "diferenciaImporte": 350.00,
    "diferenciaPorcentaje": null,
    "sinBaseComparacion": true,
    "tendencia": "subida",
    "porCamarero": [
      { "camareroId": "c1", "nombre": "Marta", "importeActual": 350.00, "importeAnterior": 0.00, "diferenciaImporte": 350.00, "diferenciaPorcentaje": null, "sinBaseComparacion": true, "tendencia": "subida" }
    ],
    "porPlato": [
      { "platoId": "p1", "nombre": "Croquetas", "partida": "entrantes", "importeActual": 140.00, "importeAnterior": 0.00, "diferenciaImporte": 140.00, "diferenciaPorcentaje": null, "sinBaseComparacion": true, "tendencia": "subida" }
    ]
  }
}
```

En este caso el porcentaje no se calcula (división por cero evitada); la presentación prioriza
«sin base de comparación» sobre cualquier porcentaje.

### Respuesta `200 OK` sin ventas

```json
{
  "fecha": "2026-10-13",
  "totalVendido": 0.00,
  "numeroCuentas": 0,
  "porCamarero": [
    { "camareroId": "c1", "nombre": "Marta", "importe": 0.00, "numeroCuentas": 0 },
    { "camareroId": "c2", "nombre": "Luis",  "importe": 0.00, "numeroCuentas": 0 }
  ],
  "porPlato": [
    { "platoId": "p1", "nombre": "Croquetas", "partida": "entrantes",   "cantidad": 0, "importe": 0.00 },
    { "platoId": "p2", "nombre": "Entrecot",  "partida": "principales", "cantidad": 0, "importe": 0.00 }
  ],
  "comparacion": { "diaActual": "2026-10-13", "diaAnterior": null, "importeActual": 0.00, "importeAnterior": null, "diferenciaImporte": null, "diferenciaPorcentaje": null, "sinBaseComparacion": false, "tendencia": "sin_variacion", "porCamarero": [], "porPlato": [] }
}
```

Los desgloses del informe mantienen las filas con `0,00 €` aunque el día no tenga ventas; los
desgloses de la comparación quedan vacíos cuando no existe día anterior.

### Errores

| Código | Cuándo |
|--------|--------|
| `400 Bad Request` | `date` con formato o valor inválido, día en curso o fecha futura |
| `401 Unauthorized` | Sin autenticación |
| `403 Forbidden` | Autenticado sin rol `encargado` |
| `500 Internal Server Error` | Error inesperado al agregar (respuesta de error estándar) |

### Notas de rendimiento

- La consulta de un día debe resolverse en menos de 3 s (SC-005); objetivo interno < 1 s.
- El endpoint no muta estado (idempotente por día).
