# Phase 1 — Data Model: Abrir mesa y tomar comanda

**Feature**: `001-comandas` | **Date**: 2026-10-13

Modelo de datos derivado de las entidades clave de la spec. Los importes se guardan como enteros en
céntimos. La base de datos es PostgreSQL 16.

## Partida (catálogo fijo)

Agrupación por la que se ordena el pedido.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `codigo` | texto (PK) | Uno de `entrantes`, `principales`, `postres` (fijo) |
| `nombre` | texto | Etiqueta en español de España |
| `orden` | entero | Orden de presentación (1, 2, 3) |

- **Reglas**: catálogo fijo; no se crean ni modifican partidas en esta versión (coherente con 008).
- **Nota**: puede implementarse como tipo enumerado (`enum`) en PostgreSQL en lugar de tabla.

## Plato

Artículo de la carta que se puede pedir.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `nombre` | texto | Obligatorio, no vacío |
| `partida` | Partida (FK) | Obligatorio; determina la agrupación del pedido |
| `precio_centimos` | entero | Obligatorio, > 0 |
| `disponible` | booleano | Solo lectura en esta historia (lo gestiona 008) |

- **Relaciones**: un `Plato` pertenece a una `Partida`; aparece en muchas `LineaComanda`.
- **Reglas**: en esta historia los platos se leen como "carta vigente"; su gestión (crear, precio,
  disponibilidad) pertenece a la historia 008.

## Mesa

Puesto del restaurante que el camarero abre.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `identificador` | texto | Obligatorio y único en el local (p. ej. "Mesa 5") |
| `estado` | texto | `libre` o `ocupada` |

- **Estados**: `libre` → `ocupada` al abrir la mesa. La vuelta a `libre` (cierre) pertenece a 006.
- **Relaciones**: una `Mesa` puede tener una `Comanda` en curso (como máximo una).

## Comanda

Pedido tomado para una mesa.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `mesa_id` | Mesa (FK) | Obligatorio |
| `camarero_id` | texto | Identificador del camarero que la toma (sesión) |
| `estado` | texto | `en_curso` o `enviada` |
| `creada_en` | timestamp | Se fija al crear la comanda |
| `confirmada_en` | timestamp (nullable) | Se fija al confirmar |

- **Reglas de unicidad**: como máximo **una** comanda en estado `en_curso` por mesa
  (restricción única parcial sobre `mesa_id` donde `estado = 'en_curso'`).
- **Estados**: `en_curso` → `enviada` al confirmar. La modificación posterior (`modificada`) es
  objeto de la historia 002.
- **Relaciones**: una `Comanda` tiene muchas `LineaComanda`; pertenece a una `Mesa`.

## LineaComanda

Cada plato anotado dentro de una comanda.

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `comanda_id` | Comanda (FK) | Obligatorio |
| `plato_id` | Plato (FK) | Obligatorio |
| `cantidad` | entero | Obligatorio, ≥ 1 |
| `precio_centimos` | entero | Copia del precio del plato **en el momento de pedirlo**; no se recalcula |
| `partida` | Partida | Derivada del `Plato` (se conserva para agrupar/consultar) |

- **Reglas**: se permite repetir el mismo `plato_id` en varias líneas (una por repetición) o
  aumentar la `cantidad` de una línea; ambas opciones son válidas y equivalentes funcionalmente.
- **Precio**: fijado al crear la línea (decisión de clarificación; ver `research.md` §4).

## Camarero (referenciado)

- **En esta historia** no se modela como entidad propia; se usa el `camarero_id` de la sesión
  existente (ver `research.md` §8). La gestión de usuarios y roles queda fuera de alcance.

## Transiciones de estado

```text
Mesa:     libre ──(abrir mesa)──▶ ocupada
Comanda:  (crear) ──▶ en_curso ──(confirmar)──▶ enviada
```

Reglas de validación asociadas a la transición:

- No se puede abrir una mesa que ya tiene una comanda `en_curso` (FR-005).
- No se puede confirmar una comanda sin líneas (FR-014).
- Al confirmar, la comanda pasa a `enviada`, queda vinculada a su mesa (FR-017) y el pedido se
  devuelve/expone agrupado por partidas (FR-016).
- El precio de la línea se fija al añadirla (FR-018).

## Vista de pedido agrupado por partidas

Estructura derivada (no persistida) que se genera al confirmar y al consultar una comanda enviada.
Terminología: **comanda** es el registro persistido; **pedido agrupado por partidas** es esta vista
derivada que consumirá cocina.

```text
Pedido
├── mesa: { id, identificador }
├── comanda_id
├── confirmada_en
└── partidas:
    ├── entrantes:  [ { plato, cantidad, precio_centimos } ... ]
    ├── principales:[ { plato, cantidad, precio_centimos } ... ]
    └── postres:    [ { plato, cantidad, precio_centimos } ... ]
```
