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
| `date` | `YYYY-MM-DD` | No | Día natural **completado** (Europe/Madrid) a consultar. Si se omite, se usa el último día natural completado. No se admite el día en curso ni fechas futuras. |

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
      { "camareroId": "c1", "diferenciaImporte": 40.00, "tendencia": "subida" },
      { "camareroId": "c2", "diferenciaImporte": 67.50, "tendencia": "subida" }
    ],
    "porPlato": [
      { "platoId": "p1", "diferenciaImporte": 25.00, "tendencia": "subida" },
      { "platoId": "p2", "diferenciaImporte": -12.00, "tendencia": "bajada" }
    ]
  }
}
```

Reglas del cuerpo:
- `totalVendido` = suma de `importeTotal` de las cuentas cerradas del día.
- `porCamarero` incluye a los camareros que cerraron cuentas ese día; `importe` puede ser `0.00`.
- `porPlato` incluye los platos vendidos ese día con su `cantidad` e `importe`.
- `comparacion.tendencia` ∈ {`subida`, `bajada`, `sin_variacion`}.
- `comparacion.sinBaseComparacion` es `true` cuando `diaAnterior` existe, `importeAnterior = 0` e
  `importeActual > 0`; en ese caso `diferenciaImporte = importeActual`,
  `diferenciaPorcentaje = null` y la UI muestra la diferencia en euros con «sin base de
  comparación», sin porcentaje (FR-011, SC-006).
- Si no hay día anterior con datos: `diaAnterior = null`, `diferenciaPorcentaje = null`,
  `sinBaseComparacion = false`, `tendencia = "sin_variacion"` y `porCamarero`/`porPlato` vacíos
  (la UI muestra "sin datos anteriores").
- Importes numéricos en euros (el formateo `es-ES`/€ se realiza en la presentación).

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
      { "camareroId": "c1", "diferenciaImporte": 350.00, "tendencia": "subida" }
    ],
    "porPlato": [
      { "platoId": "p1", "diferenciaImporte": 140.00, "tendencia": "subida" }
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
  "porCamarero": [],
  "porPlato": [],
  "comparacion": { "diaActual": "2026-10-13", "diaAnterior": null, "importeActual": 0.00, "importeAnterior": null, "diferenciaImporte": null, "diferenciaPorcentaje": null, "sinBaseComparacion": false, "tendencia": "sin_variacion", "porCamarero": [], "porPlato": [] }
}
```

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
