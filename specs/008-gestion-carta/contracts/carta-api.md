# Contrato: API de la carta (`carta-api`)

Interfaz HTTP de gestión (administrador) y de consulta (sala). Formato JSON, UTF-8.

## Autorización

- **Endpoints de gestión** (`/api/admin/*`): requieren usuario autenticado con rol
  **`administrador`**. Sin autenticación → `401`; autenticado sin ese rol → `403`.
- **Endpoint de consulta** (`/api/carta`): requiere usuario autenticado (cualquier rol).

## Gestión de platos (rol `administrador`)

### `GET /api/admin/platos`

Devuelve todos los platos de la carta, incluidos los no disponibles, con su disponibilidad derivada
y su motivo.

Respuesta `200 OK`:

```json
[
  {
    "id": "p1",
    "nombre": "Croquetas",
    "partida": "entrantes",
    "precio": 7.00,
    "activo": true,
    "ofrecible": true,
    "motivo": "activo",
    "ingredientes": [{ "id": "i1", "nombre": "Jamón", "estado": "disponible" }]
  },
  {
    "id": "p2",
    "nombre": "Entrecot",
    "partida": "principales",
    "precio": 20.00,
    "activo": true,
    "ofrecible": false,
    "motivo": "ingrediente_agotado",
    "ingredientes": [{ "id": "i2", "nombre": "Solomillo", "estado": "agotado" }]
  }
]
```

### `POST /api/admin/platos`

Crea un plato.

Cuerpo:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `nombre` | string | Sí | Nombre no vacío. |
| `partida` | enum | Sí | `entrantes` \| `principales` \| `postres`. |
| `precio` | number | Sí | Euros, estrictamente mayor que cero. |
| `activo` | boolean | No | Disponibilidad manual inicial (por defecto `true`). |
| `ingredienteIds` | string[] | No | Ingredientes asociados. |

Respuesta `201 Created`: el plato creado (misma forma que en el listado).

### `PATCH /api/admin/platos/:id`

Modifica nombre, partida, precio y/o `activo` de un plato existente. Los campos omitidos no cambian.

Cuerpo (cualquier subconjunto de `nombre`, `partida`, `precio`, `activo`, `ingredienteIds`).

Respuesta `200 OK`: el plato actualizado con su disponibilidad derivada.

Errores de esta sección:

| Código | Cuándo |
|--------|--------|
| `400 Bad Request` | `nombre` vacío, `partida` no válida, `precio` vacío/negativo/cero o cuerpo malformado |
| `401 Unauthorized` | Sin autenticación |
| `403 Forbidden` | Autenticado sin rol `administrador` |
| `404 Not Found` | `:id` de plato inexistente |
| `500 Internal Server Error` | Error inesperado (respuesta de error estándar) |

Reglas del cuerpo:
- `precio` se valida en euros y debe ser `> 0` (FR-004); no se guarda un valor inválido.
- No existe `DELETE`: la baja se hace con `PATCH { "activo": false }` (FR-014).
- Un cambio de `precio` no altera líneas de pedido ya tomadas (FR-014).
- `ingredienteIds` debe referenciar ingredientes existentes y sin duplicados; en `PATCH` sustituye
  el conjunto completo de asociaciones (un array vacío las elimina) (FR-015).
- Asociar o desasociar ingredientes se refleja en la disponibilidad derivada en la siguiente
  lectura, sin acciones adicionales (FR-009/FR-015).

## Gestión de ingredientes (rol `administrador`)

### `GET /api/admin/ingredientes`

Devuelve el catálogo de ingredientes con su estado.

Respuesta `200 OK`:

```json
[
  { "id": "i1", "nombre": "Jamón", "estado": "disponible" },
  { "id": "i2", "nombre": "Solomillo", "estado": "agotado" }
]
```

### `POST /api/admin/ingredientes`

Crea un ingrediente.

Cuerpo:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `nombre` | string | Sí | Nombre no vacío. |
| `estado` | enum | No | `disponible` \| `agotado` (por defecto `disponible`). |

Respuesta `201 Created`: el ingrediente creado (misma forma que en el listado).

### `PATCH /api/admin/ingredientes/:id`

Modifica el nombre y/o el estado de un ingrediente. Los campos omitidos no cambian. El efecto del
estado sobre la oferta de los platos se deriva en la lectura.

Cuerpo (cualquier subconjunto): `{ "nombre": "Jamón ibérico", "estado": "agotado" }`.

Respuesta `200 OK`: el ingrediente actualizado.

Errores de esta sección:

| Código | Cuándo |
|--------|--------|
| `400 Bad Request` | `nombre` vacío, `estado` no válido o cuerpo malformado |
| `401 Unauthorized` | Sin autenticación |
| `403 Forbidden` | Autenticado sin rol `administrador` |
| `404 Not Found` | `:id` de ingrediente inexistente |
| `500 Internal Server Error` | Error inesperado (respuesta de error estándar) |

Reglas del cuerpo:
- No existe `DELETE` para ingredientes: esta historia cubre alta y edición (FR-015).
- Un ingrediente puede estar asociado a uno o varios platos; cambiar su estado afecta a todos ellos
  (caso límite del ingrediente compartido).

### Asociación de ingredientes con platos

La asociación se gestiona desde el plato, sin endpoints propios: `POST /api/admin/platos` y
`PATCH /api/admin/platos/:id` aceptan `ingredienteIds`.

- Los identificadores deben existir; si alguno no existe, se responde `400` y no se guarda el
  cambio (FR-015).
- En `PATCH` el array representa el conjunto completo: sustituye las asociaciones anteriores; un
  array vacío las elimina.
- Asociar un ingrediente agotado oculta el plato en la siguiente lectura; retirarlo puede volver a
  ofrecerlo si el plato sigue `activo` (FR-012/FR-015).

## Consulta de la carta vigente (cualquier rol autenticado)

### `GET /api/carta`

Devuelve únicamente los platos ofrecibles, agrupados por partida. Es la carta que consumen las
tabletas de sala (historia 01).

Respuesta `200 OK`:

```json
{
  "entrantes": [
    { "id": "p1", "nombre": "Croquetas", "precio": 7.00 }
  ],
  "principales": [
    { "id": "p3", "nombre": "Paella", "precio": 15.00 }
  ],
  "postres": []
}
```

Reglas del cuerpo:
- Solo se incluyen platos con `ofrecible = true` (`activo = true` y sin ingredientes agotados)
  (FR-006, FR-012).
- Los platos ocultos por baja manual o por ingrediente agotado **no** aparecen.
- Importes numéricos en euros (el formateo `es-ES`/€ se realiza en la presentación).
- La respuesta refleja el estado actual en cada petición, sin caché (FR-009/FR-010, SC-002).

Errores: `401` (sin autenticación), `500`.

### Notas de rendimiento

- La consulta de la carta y el guardado de un plato deben resolverse por debajo de 1 s; un cambio de
  precio o disponibilidad se refleja en sala en menos de 3 s (SC-002).
- Los endpoints de escritura no alteran el historial de pedidos ni de cuentas.
