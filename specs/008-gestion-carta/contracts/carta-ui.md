# Contrato: Interfaz de gestión de la carta (`carta-ui`)

Describe las pantallas, componentes y estados que debe ofrecer el frontend (React + Chakra UI,
español de España, euro). No prescribe implementación, sino el comportamiento observable.

## Rutas

| Ruta | Rol | Propósito |
|------|-----|-----------|
| `/admin/carta` | `administrador` | Página de gestión de la carta (platos e ingredientes). |
| (carta de sala) | cualquier autenticado | Vista de la carta vigente que consume la historia 01; no se modifica aquí. |

Acceso a `/admin/carta` sin rol administrador: se deniega y no se muestra la entrada de menú.

## Página `/admin/carta`

### Componentes

- **TablaPlatos**: lista de platos con `nombre`, `partida`, `precio` (formateado en €), estado
  manual (`activo`) y disponibilidad ofrecida. Indica el motivo cuando un plato no se ofrece
  ("desactivado" o "ingrediente agotado"). Acciones por fila: editar y activar/desactivar.
- **FormularioPlato**: alta y edición con `nombre`, `partida` (selector con los tres valores fijos),
  `precio` y asociación de ingredientes. Valida que el precio sea mayor que cero antes de enviar y
  conserva el último valor válido ante un error.
- **SelectorIngredientes**: selección múltiple de los ingredientes existentes para asociarlos al
  plato; permite añadir y quitar asociaciones y muestra los que ya tiene.
- **PanelIngredientes**: lista de ingredientes con su nombre y estado (`disponible`/`agotado`), con
  acciones para crear uno nuevo, editar su nombre y cambiar su estado. Al cambiar el estado se
  refresca la disponibilidad de todos los platos afectados.
- **FormularioIngrediente**: alta y edición con `nombre` (no vacío) y `estado`; valida ambos campos
  y conserva el último valor válido ante un error.
- **EstadoConexion**: indicador de "sin conexión" coherente con el resto de la aplicación; conserva
  lo escrito y no permite guardar mientras no haya conexión.

### Estados de la página

| Estado | Comportamiento |
|--------|----------------|
| Cargando | Indicador de carga (spinner de Chakra UI). |
| Datos | Tabla de platos y panel de ingredientes con la información vigente. |
| Vacío | Sin platos: mensaje y acceso directo a crear el primero. |
| Error / sin conexión | Mensaje claro; no permite guardar; conserva lo escrito; permite reintentar. |
| Guardado correcto | El cambio aparece en la tabla; el plato se marca según la regla combinada. |
| Validación | Precio vacío/negativo, partida no válida, nombre de ingrediente vacío, estado no válido o ingrediente inexistente en la asociación: aviso junto al campo, sin guardar. |

### Reglas de comportamiento

- Un plato creado o modificado se refleja de inmediato en la lista (SC-001) y en la carta de sala en
  menos de 3 s (SC-002), sin acciones adicionales.
- Marcar un plato como no disponible lo retira de la carta de sala (FR-006, SC-003).
- El administrador puede crear y editar ingredientes y asociarlos a uno o varios platos desde esta
  misma página; las asociaciones se guardan con el plato (FR-015, SC-006).
- Asociar un ingrediente a un plato sin desactivarlo y marcarlo después como `agotado` retira ese
  plato de la oferta (escenario 5 de la US3).
- Cambiar un ingrediente a `agotado` oculta todos los platos que lo usan sin desactivarlos (FR-007,
  SC-004); al volver a `disponible` solo reaparecen si siguen manualmente activos (FR-012).
- Al restaurar un ingrediente, un plato desactivado manualmente permanece oculto (escenario 4 de la
  US3).
- Un ingrediente compartido por varios platos se muestra una sola vez en el panel; su cambio de
  estado afecta a todos los platos asociados (caso límite).
- El resto de usuarios solo ve la carta vigente y no dispone de controles de edición (FR-001,
  SC-005).

### Accesibilidad y contenido

- Textos, etiquetas y avisos en español de España; importes en euros con formato `es-ES`.
- Controles navegables por teclado y con etiqueta accesible (Chakra UI).
- Los mensajes de error explican qué falta (p. ej. "El precio debe ser mayor que cero").
