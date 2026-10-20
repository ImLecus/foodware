# Phase 1 — Data Model: Abrir mesa y tomar pedido

**Feature**: `001-comandas` | **Date**: 2026-10-20

Modelo de datos derivado de las entidades clave de la spec. Los importes se guardan como enteros en
céntimos. La base de datos es SQLite.

## Partida (catálogo fijo)

Agrupación por la que se ordena el pedido.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `codigo` | texto (PK) | Uno de `entrantes`, `principales`, `postres` (fijo) |
| `nombre` | texto | Etiqueta en español de España |
| `orden` | entero | Orden de presentación (1, 2, 3) |

- **Reglas**: catálogo fijo; no se crean ni modifican partidas en esta versión (coherente con 008).
- **Nota**: puede implementarse como una restricción CHECK en SQLite en lugar de tabla.

## Plato

Artículo de la carta que se puede pedir.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `nombre` | texto | Obligatorio, no vacío |
| `partida` | Partida (FK) | Obligatorio; determina la agrupación del pedido |
| `precio_centimos` | entero | Obligatorio, > 0 |
| `disponible` | booleano | Solo lectura en esta historia (lo gestiona 008) |

- **Relaciones**: un `Plato` pertenece a una `Partida`; aparece en muchas `LineaPedido`.
- **Reglas**: en esta historia los platos se leen como "carta vigente"; su gestión (crear, precio,
  disponibilidad) pertenece a la historia 008.

## Mesa

Puesto del restaurante que el camarero abre.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `identificador` | texto | Obligatorio y único en el local (p. ej. "Mesa 5") |
| `estado` | texto | `libre` o `ocupada` |

- **Estados**: `libre` → `ocupada` al abrir la mesa; `ocupada` → `libre` al anular el pedido en
  curso. La vuelta a `libre` por cierre de cuenta pertenece a 006.
- **Relaciones**: una `Mesa` puede tener una `Pedido` en curso (como máximo una).

## Pedido

Pedido tomado para una mesa.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `mesa_id` | Mesa (FK) | Obligatorio |
| `camarero_id` | texto | Identificador del camarero que la toma (sesión) |
| `estado` | texto | `en_curso` o `enviada` |
| `creada_en` | timestamp | Se fija al crear el pedido |
| `confirmada_en` | timestamp (nullable) | Se fija al confirmar |

- **Reglas de unicidad**: como máximo **una** pedido en estado `en_curso` por mesa
  (restricción única parcial sobre `mesa_id` donde `estado = 'en_curso'`).
- **Estados**: `en_curso` → `enviada` al confirmar. La modificación posterior (`modificada`) es
  objeto de la historia 002.
- **Anulación**: un pedido `en_curso` puede anularse; el pedido y sus `LineaPedido` se **eliminan**
  de la base de datos y no se conserva un estado `anulada` (decisión en `research.md` §11). Un
  pedido `enviada` no se puede anular.
- **Relaciones**: una `Pedido` tiene muchas `LineaPedido`; pertenece a una `Mesa`.

## LineaPedido

Cada plato anotado dentro de un pedido.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `pedido_id` | Pedido (FK) | Obligatorio |
| `plato_id` | Plato (FK) | Obligatorio |
| `cantidad` | entero | Obligatorio, ≥ 1 |
| `precio_centimos` | entero | Copia del precio del plato **en el momento de pedirlo**; no se recalcula |
| `partida` | Partida | Derivada del `Plato` (se conserva para agrupar/consultar) |

- **Reglas**: se permite repetir el mismo `plato_id` en varias líneas (una por repetición) o
  aumentar la `cantidad` de una línea; ambas opciones son válidas y equivalentes funcionalmente.
- **Anulación**: al anular el pedido, sus líneas se eliminan con él (borrado en cascada).
- **Precio**: fijado al crear la línea (decisión de clarificación; ver `research.md` §4).

## Camarero (referenciado)

- **En esta historia** no se modela como entidad propia; se usa el `camarero_id` de la sesión
  existente (ver `research.md` §8). La gestión de usuarios y roles queda fuera de alcance.

## Transiciones de estado

```text
Mesa:     libre ──(abrir mesa)──▶ ocupada ──(anular pedido)──▶ libre
Pedido:  (crear) ──▶ en_curso ──(confirmar)──▶ enviada
                        └──(anular)──▶ (eliminado)
```

Reglas de validación asociadas a la transición:

- No se puede abrir una mesa que ya tiene un pedido `en_curso` (FR-005).
- No se puede confirmar un pedido sin líneas (FR-014).
- Al confirmar, el pedido pasa a `enviada`, queda vinculado a su mesa (FR-017) y el pedido se
  devuelve/expone agrupado por partidas (FR-016).
- Al anular, solo se admite un pedido `en_curso`: se eliminan el pedido y sus líneas, la mesa pasa
  a `libre` y no se publica ningún pedido hacia cocina (FR-019). Un pedido `enviada` devuelve
  conflicto.
- El precio de la línea se fija al añadirla (FR-018).

## Vista de pedido agrupado por partidas

Estructura derivada (no persistida) que se genera al confirmar y al consultar un pedido enviado.
Terminología: **pedido** es el registro persistido; **pedido agrupado por partidas** es esta vista
derivada que consumirá cocina.

```text
Pedido
├── mesa: { id, identificador }
├── pedido_id
├── confirmada_en
└── partidas:
    ├── entrantes:  [ { plato, cantidad, precio_centimos } ... ]
    ├── principales:[ { plato, cantidad, precio_centimos } ... ]
    └── postres:    [ { plato, cantidad, precio_centimos } ... ]
```

## Eventos SSE

El hub SSE compartido (`backend/src/realtime/hub.js`) emite eventos de estado; esta historia publica
«pedido-confirmado» al confirmar y «pedido-anulado» al anular (para que sala refresque la mesa
como `libre`), y el frontend se suscribe vía `GET /api/eventos`.
