# Phase 1 — Data Model: Marcar platos como listos

Se describen las entidades que esta historia necesita. Los campos no usados directamente aquí
(por ejemplo, importes o configuración de la carta) se dejan fuera y se ampliarán en las historias
que los necesiten.

## Entidades

### Partida
- **Descripción**: agrupación fija de la carta que determina qué pedidos ve y sobre qué platos
  actúa cada cocinero.
- **Campos**: `id`, `nombre` (`entrantes` | `principales` | `postres`).
- **Reglas**: el conjunto de partidas es cerrado (tres valores).

### Usuario (cocinero / camarero)
- **Descripción**: persona que usa la aplicación. Un cocinero tiene una partida asignada; un
  camarero atiende una o varias mesas.
- **Campos**: `id`, `nombre`, `rol` (`cocinero` | `camarero`), `partidaId` (solo cocinero).
- **Relaciones**: un cocinero pertenece a una partida (historia 03); un camarero atiende mesas
  (la asignación camarero-mesa se detalla en la historia 05).

### Mesa
- **Descripción**: mesa de sala de la que procede el pedido.
- **Campos**: `id`, `numero`, `estado` (`libre` | `ocupada`).
- **Reglas**: `numero` es único dentro del restaurante.

### Pedido de cocina
- **Descripción**: porción de una comanda enviada desde sala que corresponde a una partida y a una
  mesa. Está pendiente mientras alguna de sus líneas no esté lista.
- **Campos**: `id`, `mesaId`, `partidaId`, `enviadoEn` (marca temporal), `modificadoEn` (marca
  temporal, si se editó; historia 02), `estado` (derivado: `pendiente` | `completado`).
- **Relaciones**: un pedido pertenece a una mesa y a una partida; contiene una o más líneas.
- **Reglas**: `estado` se deriva del estado de sus líneas (es `completado` cuando todas están
  `listo`); nunca se modifica a mano (FR-006).

### Línea de pedido (plato)
- **Descripción**: un plato del pedido con su cantidad; es la unidad sobre la que actúa el
  cocinero.
- **Campos**: `id`, `pedidoId`, `platoId`, `nombrePlato`, `cantidad` (entero ≥ 1), `estado`
  (`pendiente` | `listo`), `listoEn` (marca temporal, nula si está pendiente).
- **Relaciones**: pertenece a un pedido; referencia un plato de la carta (historia 08).
- **Reglas**:
  - La marca se aplica a la **línea completa** (todas las unidades), no a unidades sueltas
    (FR-013).
  - `listoEn` se fija al marcar como listo y se limpia al deshacer (FR-007, FR-015).
  - `cantidad` ≥ 1.

### Marca de listo (atributo de la línea)
- **Descripción**: constancia del momento en que una línea se marcó como lista.
- **Campos**: `listoEn` en la propia línea.
- **Reglas**: mientras la línea está `listo`, `listoEn` no cambia al re-marcar (FR-009); al
  deshacer, se descarta y la línea vuelve a `pendiente` (FR-014, FR-015).

## Transiciones de estado de una línea de pedido

| Estado origen | Acción | Estado destino | Efecto en `listoEn` |
|---------------|--------|----------------|---------------------|
| `pendiente`   | Marcar como listo | `listo`   | se fija el momento actual |
| `listo`       | Marcar como listo (reintento) | `listo` | sin cambios (idempotente) |
| `listo`       | Deshacer la marca | `pendiente` | se limpia |

## Reglas de validación (trazadas a la spec)

- **V-001**: solo puede marcarse una línea cuyo pedido esté `pendiente` y pertenezca a la partida
  del cocinero (FR-002, FR-003).
- **V-002**: la operación de marcar/deshacer es idempotente y atómica; dos marcas simultáneas del
  mismo plato producen un único momento registrado (FR-009, FR-010).
- **V-003**: al pasar todas las líneas a `listo`, el pedido deja de listarse como pendiente
  (FR-006).
- **V-004**: la marca se refleja tanto en cocina como en las pantallas de los camareros que
  atienden la mesa, de forma coherente (FR-008, FR-011).

## Notas de persistencia

- SQLite con relaciones por clave externa (`pedidoId`, `mesaId`, `partidaId`, `platoId`).
- Índices previstos: `línea(pedidoId)`, `pedido(partidaId, estado)` y `pedido(mesaId)`, para
  servir la lista de cocina y el estado de sala con eficiencia.
