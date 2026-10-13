# Feature Specification: Gestión de la carta

**Feature Branch**: `008-gestion-carta`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "genera el spec de la historia de usuario 08-admin.md"

## Clarifications

### Session 2026-10-13

- Q: ¿De dónde procede la información de que un ingrediente está agotado para la baja automática de platos? → A: El sistema registra el estado de cada ingrediente (disponible/agotado) y el administrador lo actualiza; los platos asociados se ofrecen o se ocultan automáticamente al cambiar ese estado.
- Q: Si un plato se oculta por ingrediente agotado y además el administrador lo ha deshabilitado manualmente, ¿qué ocurre al restaurarse el ingrediente? → A: Disponibilidad combinada: el plato se ofrece solo si está manualmente activo y todos sus ingredientes están disponibles; al restaurar, vuelve solo si la disponibilidad manual lo permite.
- Q: ¿La gestión del administrador incluye crear y modificar partidas, o son fijas? → A: Las partidas son fijas (entrantes, principales y postres); el administrador solo asigna la partida de cada plato, sin gestionar categorías.
- Q: ¿La aplicación debe funcionar sin conexión o exige estar conectada a la red del restaurante? → A: Exige conexión: al perderse muestra un indicador de "sin conexión", no permite confirmar ni modificar y conserva lo escrito en pantalla hasta recuperarla.
- Q: Si el precio de un plato cambia entre el pedido y el cierre de la cuenta, ¿qué precio se usa? → A: El precio del momento de pedir: queda fijado al tomar la comanda y no cambia después.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gestión del catálogo de platos (Priority: P1)

El administrador gestiona la carta desde la aplicación, sin depender de soporte técnico ni de
cambios manuales fuera del sistema. Puede crear platos nuevos, modificar los existentes y
ajustar los precios cuando sea necesario. Al tratarse de la carta vigente, cualquier modificación
queda reflejada automáticamente en las tabletas de sala.

**Why this priority**: es la funcionalidad central de la historia; sin poder crear y modificar
platos no existe gestión de la carta y el resto de la historia pierde sentido. Entrega valor de
forma aislada.

**Independent Test**: se puede probar de forma independiente creando un plato nuevo y
comprobando que aparece en la carta de sala.

**Acceptance Scenarios**:

1. **Given** que el administrador está autenticado en la aplicación, **When** crea un plato con
   nombre, partida y precio, **Then** el plato aparece en la carta vigente, agrupado en su
   partida correspondiente.
2. **Given** un plato existente en la carta, **When** el administrador modifica su nombre o su
   precio, **Then** la modificación se refleja en la carta vigente de inmediato.
3. **Given** que el administrador crea un plato sin especificar un precio, **When** guarda el
   plato, **Then** el sistema le avisa de que falta el precio y no guarda el plato sin él.

---

### User Story 2 - Gestión de precios y disponibilidad (Priority: P1)

Además del catálogo, el administrador controla la disponibilidad de cada plato. Puede marcar
un plato como disponible o no disponible manualmente, por ejemplo cuando un ingrediente se
agota y la cocina no puede prepararlo. Un plato marcado como no disponible deja de ofrecerse
en las tabletas de sala, de manera que el camarero no pueda tomar un pedido que cocina no
podrá preparar.

**Why this priority**: la disponibilidad es lo que evita pedidos imposibles, el objetivo central de
la historia. Sin el control de disponibilidad no se cumple el propósito principal del encargo.

**Independent Test**: se puede probar de forma independiente marcando un plato como no
disponible y comprobando que deja de aparecer en la carta de sala.

**Acceptance Scenarios**:

1. **Given** un plato disponible y visible en la carta de sala, **When** el administrador lo marca
   como no disponible, **Then** el plato deja de ofrecerse en las tabletas de sala de inmediato.
2. **Given** un plato marcado como no disponible, **When** el administrador lo marca como
   disponible de nuevo, **Then** el plato vuelve a ofrecerse en la carta de sala.
3. **Given** que el resto de los usuarios consulta la carta, **When** la disponibilidad de un plato
   cambia, **Then** solo ven el estado actualizado del plato y no información obsoleta.

---

### User Story 3 - Actualización automática por agotamiento de ingrediente (Priority: P2)

Si un ingrediente se agota, el plato correspondiente debe dejar de ofrecerse automáticamente.
El sistema registra el estado de cada ingrediente (disponible o agotado) y el administrador lo
actualiza; cuando un ingrediente pasa a agotado, los platos que lo usan se ocultan en las
tabletas de sala sin más intervención. Cuando el ingrediente vuelve a estar disponible, los
platos asociados recuperan la oferta de forma automática.

**Why this priority**: refuerza el objetivo de evitar pedidos imposibles, pero depende de que el
administrador mantenga actualizado el estado de los ingredientes, por lo que se sitúa por detrás
de la gestión manual.

**Independent Test**: se puede probar de forma independiente cambiando el estado de un
ingrediente a agotado y comprobando que el plato desaparece de la carta de sala sin que el
administrador tenga que desactivar el plato.

**Acceptance Scenarios**:

1. **Given** un plato con un ingrediente cuyo estado pasa a agotado, **When** el administrador
   actualiza el estado de ese ingrediente, **Then** el plato se vuelve no disponible
   automáticamente en las tabletas de sala.
2. **Given** un plato no disponible por agotamiento de ingrediente, **When** el ingrediente
   vuelve a estar disponible, **Then** el plato se ofrece de nuevo en la carta de sala.
3. **Given** un plato con varios ingredientes, **When** uno de ellos pasa a agotado, **Then** el
   plato se vuelve no disponible automáticamente.
4. **Given** un plato deshabilitado manualmente por el administrador y con un ingrediente
   agotado, **When** ese ingrediente vuelve a estar disponible, **Then** el plato no vuelve a
   ofrecerse porque sigue deshabilitado manualmente.

---

### Edge Cases

- Un plato sin ingredientes asociados: su disponibilidad depende únicamente del estado manual
  marcado por el administrador.
- El administrador intenta guardar un precio vacío o negativo: el sistema lo rechaza con un
  aviso y conserva el último valor válido.
- Un plato ya vendido en días anteriores: no se elimina del registro, se gestiona mediante su
  disponibilidad para preservar el historial de ventas.
- El cambio de precio de un plato: afecta solo a la carta vigente y a los nuevos pedidos; no
  modifica el precio ya fijado en platos pedidos con anterioridad ni en cuentas del pasado.
- El administrador cambia datos de un plato mientras los camareros lo están pidiendo: los
  cambios se aplican a la carta vigente y se reflejan en las tabletas de sala.
- Un ingrediente agotado y reabastecido dentro del mismo servicio: el plato se oculta y se
  vuelve a ofrecer según el estado del ingrediente registrado en el sistema en cada momento.
- El administrador asigna a un plato una partida que no existe entre las fijas: el sistema lo
  rechaza con un aviso y conserva la partida válida anterior.
- Un plato deshabilitado manualmente mientras un ingrediente se agota: el plato permanece
  oculto; al restaurarse el ingrediente no vuelve a ofrecerse hasta que el administrador lo
  reactive (regla de disponibilidad combinada).
- Platos duplicados con el mismo nombre: se permiten como platos distintos si tienen partida o
  precio distinto; la identidad se resuelve por plato, no por nombre.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Solo el administrador MUST poder crear platos, modificar sus datos, cambiar sus
  precios y cambiar su disponibilidad; el resto de los usuarios solo ve la carta vigente.
- **FR-002**: El sistema MUST permitir al administrador crear un plato con nombre, partida y
  precio, e incluirlo en la carta.
- **FR-003**: El sistema MUST permitir al administrador modificar el nombre, la partida y el
  precio de un plato existente.
- **FR-004**: El sistema MUST exigir un precio válido (mayor que cero) al crear o modificar un
  plato y rechazar valores vacíos o negativos con un aviso.
- **FR-005**: El sistema MUST permitir al administrador marcar un plato como disponible o no
  disponible manualmente.
- **FR-006**: Un plato no disponible MUST dejar de ofrecerse en las tabletas de sala y no poder
  ser pedido por el camarero.
- **FR-007**: El sistema MUST volver no disponible automáticamente un plato cuando un
  ingrediente asociado pasa a estado agotado, registrado en el sistema por el administrador.
- **FR-008**: El sistema MUST volver a ofrecer un plato cuando el ingrediente agotado pasa de
  nuevo a estado disponible, siempre que la disponibilidad manual del plato lo permita.
- **FR-012**: El sistema MUST ofrecer un plato únicamente cuando está manualmente activo y
  todos sus ingredientes están disponibles; la baja manual y la baja automática conviven con
  esta regla combinada (aclarado en la sesión de clarificación).
- **FR-013**: Las partidas de la carta MUST ser fijas (entrantes, principales y postres); el
  sistema MUST asignar cada plato a una de ellas y rechazar partidas no válidas, sin permitir
  crear ni modificar partidas (aclarado en la sesión de clarificación).
- **FR-014**: Un cambio de precio MUST NOT alterar el precio ya fijado en los platos pedidos con
  anterioridad; afecta solo a la carta vigente y a los nuevos pedidos.
- **FR-009**: Cualquier cambio de la carta (platos, precios o disponibilidad) MUST reflejarse de
  inmediato en la carta vigente que ven las tabletas de sala.
- **FR-010**: El sistema MUST mostrar al resto de usuarios siempre la carta vigente, sin
  información obsoleta tras un cambio del administrador.
- **FR-011**: Los platos gestionados siguen el formato de precio en euros y las convenciones
  españolas de número y fecha.

### Key Entities *(include if feature involves data)*

- **Plato**: elemento de la carta con nombre, partida (entrantes, principales o postres), precio y
  estado de disponibilidad; puede agruparse por partidas.
- **Carta**: conjunto de platos vigentes que se ofrece en las tabletas de sala; cambia con las
  modificaciones del administrador.
- **Ingrediente**: componente de un plato con estado registrado (disponible o agotado), cuyo
  paso a agotado desencadena la baja automática de la oferta de los platos que lo usan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El administrador puede crear o modificar un plato y su precio en menos de 1 minuto
  desde la interfaz.
- **SC-002**: Un cambio de precio o de disponibilidad se refleja en la carta de las tabletas de
  sala en menos de 3 segundos, sin acciones adicionales del administrador.
- **SC-003**: Un plato marcado como no disponible deja de poder ser pedido por los camareros
  de forma verificable desde la interfaz, sin leer código.
- **SC-004**: Un plato cuyo ingrediente pasa a agotado desaparece de la oferta de sala sin que
  el administrador tenga que desactivar el plato, de forma verificable por una persona no
  técnica desde la interfaz.
- **SC-005**: El resto de los usuarios ve siempre la carta vigente y no puede modificar platos,
  precios ni disponibilidad.

## Assumptions

- Gestionar la carta es una tarea exclusiva del administrador; la distinción de roles se resuelve
  mediante los perfiles de usuario existentes en el sistema.
- Los platos con historial de ventas no se eliminan definitivamente: se desactivan mediante su
  disponibilidad para preservar el historial.
- El agotamiento de ingredientes se gestiona por el estado que el sistema registra por
  ingrediente (disponible o agotado) y que el administrador actualiza; no existe un subsistema
  de inventario/stock en esta historia, y la oferta o baja de los platos deriva de ese estado
  (aclarado en la sesión de clarificación).
- Las partidas de la carta son fijas —entrantes, principales y postres—, coherentes con el resto
  del sistema de comandas; el administrador asigna la partida de cada plato pero no crea ni
  modifica partidas (aclarado en la sesión de clarificación).
- Los precios se expresan en euros y los formatos de número y fecha siguen la convención
  española de España (constitución del proyecto).
- La carta vigente es la que ven las tabletas de sala al tomar comandas; esta historia garantiza
  su contenido actualizado, no cómo se realiza la comanda.