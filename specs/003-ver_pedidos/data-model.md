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
- **Descripción**: porción de un pedido enviado desde sala que corresponde a una partida y a una
  mesa. Aparece en la vista mientras siga pendiente.
- **Campos**: `id`, `mesaId`, `partidaId`, `enviadoEn` (marca temporal del envío **original**),
  `modificadoEn` (marca temporal de la última edición, si la hubo), `modificado` (booleano
  derivado de `modificadoEn`), `estado` (derivado: `pendiente` | `completado`).
- **Relaciones**: pertenece a una mesa y a una partida; contiene una o más líneas.
- **Reglas**:
  - `estado` es `pendiente` mientras alguna línea no esté lista (FR-008).
  - `enviadoEn` **no** se reinicia al editar el pedido (FR-005, FR-015); `modificadoEn` solo sirve
    como marca distintiva y `modificado` indica si hubo edición posterior al envío (FR-018).
  - Solo se listan los pedidos de la partida del cocinero (FR-002, FR-003).

### Línea de pedido (plato)
- **Descripción**: plato del pedido con su cantidad y su estado.
- **Campos**: `id`, `pedidoId`, `nombrePlato`, `cantidad` (≥1), `estado` (`pendiente` | `listo`),
  `listoEn` (marca temporal, nula si pendiente).
- **Reglas**: los platos de la partida se muestran todos (incluidos los ya listos, marcados
  visualmente) (FR-007). La distinción entre listo y pendiente combina color con un símbolo o
  etiqueta de texto, nunca solo color (FR-007, SC-010).

### Estado de la vista (cliente)

No forma parte del modelo persistido ni del contrato REST; el frontend lo mantiene en memoria:

- **`cargando`**: `true` durante la carga inicial; muestra «Cargando pedidos…» y bloquea el estado
  vacío hasta recibir datos (FR-017).
- **`errorCarga`**: mensaje de error cuando falla la carga inicial; habilita la acción «Reintentar»
  y no muestra el estado vacío (FR-017, SC-011).
- **`sinConexion`**: indicador de lista no actualizada; no detiene el temporizador local del tiempo
  de espera (FR-006, SC-003).

## Campos derivados para la vista

| Campo derivado | Cómo se obtiene | Uso |
|----------------|-----------------|-----|
| `tiempoEspera` | ahora − `enviadoEn`, con el reloj local | Tiempo transcurrido mostrado; sigue avanzando sin conexión (FR-005, FR-006, SC-003) |
| `orden` | `enviadoEn` asc, y `id` asc como desempate | Orden de la lista (FR-004, SC-002) |
| `pendiente` | alguna línea con `estado = pendiente` | Pertenencia a la lista (FR-008) |
| `modificado` | `modificadoEn` no nula | Aviso «Modificado» junto al pedido (FR-018, SC-012) |

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
  vigente al reconectar; el tiempo de espera mostrado se sigue calculando con el reloj local a
  partir de `enviadoEn` (FR-006, SC-003).
- **V-005**: un pedido con `modificado = true` muestra el aviso «Modificado» sin detallar líneas y
  conserva `enviadoEn` y su posición (FR-015, FR-018, SC-012).
- **V-006**: durante la carga inicial no se muestra el estado vacío; si la carga falla, se muestra
  un error con «Reintentar» y tampoco el estado vacío (FR-017, SC-011).

## Notas de persistencia

- SQLite con índices `pedido(partidaId, estado)` y `pedido(enviadoEn)` para servir la lista
  ordenada; `linea(pedidoId)` para cargar los platos.
- `enviadoEn` es la única fuente persistida del tiempo de espera: no se almacena el tiempo
  transcurrido ni se recalcula en el servidor, sino que se deriva del instante de envío con el
  reloj del cliente (FR-006).
