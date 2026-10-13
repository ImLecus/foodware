# Phase 1 — Data Model: Ver pedidos pendientes en cocina

Se describen las entidades que la vista de cocina necesita, coherentes con el modelo compartido del
proyecto (historia 04). Los campos no usados por esta historia (importes, carta) se omiten.

## Entidades

### Partida
- **Descripción**: agrupación fija de la carta que determina qué pedidos ve cada cocinero.
- **Campos**: `id`, `nombre` (`entrantes` | `principales` | `postres`).
- **Reglas**: conjunto cerrado de tres valores.

### Cocinero (usuario)
- **Descripción**: persona que usa la vista de cocina; tiene asignada una única partida.
- **Campos**: `id`, `nombre`, `partidaId`.
- **Relaciones**: pertenece a una partida (FR-001); si no tiene partida, la vista lo indica
  (FR-013).
- **Reglas**: esta historia no crea ni cambia la asignación (se reutiliza la existente).

### Mesa
- **Descripción**: mesa de sala de la que procede el pedido.
- **Campos**: `id`, `numero`.
- **Reglas**: `numero` único; se muestra en cada pedido (FR-016, SC-009).

### Pedido de cocina
- **Descripción**: porción de una comanda enviada desde sala que corresponde a una partida y a una
  mesa. Aparece en la vista mientras siga pendiente.
- **Campos**: `id`, `mesaId`, `partidaId`, `enviadoEn` (marca temporal del envío **original**),
  `modificadoEn` (marca temporal de la última edición, si la hubo), `estado` (derivado:
  `pendiente` | `completado`).
- **Relaciones**: pertenece a una mesa y a una partida; contiene una o más líneas.
- **Reglas**:
  - `estado` es `pendiente` mientras alguna línea no esté lista (FR-008).
  - `enviadoEn` **no** se reinicia al editar la comanda (FR-005, FR-015); `modificadoEn` solo sirve
    como marca distintiva.
  - Solo se listan los pedidos de la partida del cocinero (FR-002, FR-003).

### Línea de pedido (plato)
- **Descripción**: plato del pedido con su cantidad y su estado.
- **Campos**: `id`, `pedidoId`, `nombrePlato`, `cantidad` (≥1), `estado` (`pendiente` | `listo`),
  `listoEn` (marca temporal, nula si pendiente).
- **Reglas**: los platos de la partida se muestran todos (incluidos los ya listos, marcados
  visualmente) (FR-007).

## Campos derivados para la vista

| Campo derivado | Cómo se obtiene | Uso |
|----------------|-----------------|-----|
| `tiempoEspera` | ahora − `enviadoEn` | Tiempo transcurrido mostrado (FR-005, FR-006, SC-003) |
| `orden` | `enviadoEn` asc, y `id` asc como desempate | Orden de la lista (FR-004, SC-002) |
| `pendiente` | alguna línea con `estado = pendiente` | Pertenencia a la lista (FR-008) |

## Reglas de orden (deterministas)

1. Primero el `enviadoEn` más antiguo.
2. A igual `enviadoEn`, el `id` más bajo (orden de llegada).
3. La edición posterior no altera ni `enviadoEn` ni la posición (FR-015).

## Reglas de validación (trazadas a la spec)

- **V-001**: la lista solo incluye pedidos `pendiente` de la partida del cocinero (FR-002, FR-003,
  FR-008).
- **V-002**: cada pedido expone `enviadoEn`, la mesa y sus líneas con cantidad y estado (FR-005,
  FR-007, FR-016).
- **V-003**: el orden es el definido arriba y es estable entre actualizaciones (FR-004, SC-002).
- **V-004**: ante corte de conexión, la vista se marca como no actualizada y recarga la lista
  vigente al reconectar (edge case de conexión, FR-011).

## Notas de persistencia

- SQLite con índices `pedido(partidaId, estado)` y `pedido(enviadoEn)` para servir la lista
  ordenada; `linea(pedidoId)` para cargar los platos.
