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
- **FormularioPlato**: alta y edición con `nombre`, `partida` (selector con los tres valores fijos)
  y `precio`. Valida que el precio sea mayor que cero antes de enviar y conserva el último valor
  válido ante un error.
- **PanelIngredientes**: lista de ingredientes con su estado (`disponible`/`agotado`) y control para
  cambiarlo. Al cambiar el estado se refresca la disponibilidad de los platos afectados.
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
| Validación | Precio vacío/negativo o partida no válida: aviso junto al campo, sin guardar. |

### Reglas de comportamiento

- Un plato creado o modificado se refleja de inmediato en la lista (SC-001) y en la carta de sala en
  menos de 3 s (SC-002), sin acciones adicionales.
- Marcar un plato como no disponible lo retira de la carta de sala (FR-006, SC-003).
- Cambiar un ingrediente a `agotado` oculta los platos que lo usan sin desactivarlos (FR-007,
  SC-004); al volver a `disponible` solo reaparecen si siguen manualmente activos (FR-012).
- Al restaurar un ingrediente, un plato desactivado manualmente permanece oculto (escenario 4 de la
  US3).
- El resto de usuarios solo ve la carta vigente y no dispone de controles de edición (FR-001,
  SC-005).

### Accesibilidad y contenido

- Textos, etiquetas y avisos en español de España; importes en euros con formato `es-ES`.
- Controles navegables por teclado y con etiqueta accesible (Chakra UI).
- Los mensajes de error explican qué falta (p. ej. "El precio debe ser mayor que cero").
