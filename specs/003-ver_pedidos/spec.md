# Feature Specification: Ver pedidos pendientes en cocina

**Feature Branch**: `003-ver_pedidos`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: Cuando un pedido sigue pendiente porque todavía le quedan platos por preparar, ¿qué debe mostrar la vista de cocina respecto a los platos de ese pedido que ya se marcaron como listos? (FR-007) → A: Mostrar todos los platos del pedido, marcando visualmente los platos que ya están listos.
- Q: Cuando una comanda ya enviada se edita después (historia 02), ¿qué tiempo de espera debe mostrar y usar la vista de cocina para ese pedido pendiente? (FR-004, FR-005) → A: El pedido conserva el tiempo desde su envío original; la edición se marca como señal aparte y no reinicia el tiempo de espera.
- Q: ¿Debe la vista de cocina indicar a qué mesa pertenece cada pedido pendiente, además de sus platos y cantidades? (FR-007) → A: Sí, cada pedido pendiente muestra el identificador de la mesa de la que procede.
- Q: Cuando dos pedidos pendientes tienen exactamente el mismo instante de envío, ¿con qué criterio secundario debe ordenarse la lista? (FR-004) → A: Por orden de llegada (identificador creciente del pedido).
- Q: ¿Cómo obtiene la vista de cocina la partida del cocinero que la está usando? (FR-001, FR-013) → A: Reutiliza la identidad/asignación ya existente; esta historia no introduce inicio de sesión.
- Q: ¿La aplicación debe funcionar sin conexión o exige estar conectada a la red del restaurante? → A: Exige conexión: al perderse muestra un indicador de "sin conexión", no permite confirmar ni modificar y conserva lo escrito en pantalla hasta recuperarla.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver los pedidos pendientes de mi partida, ordenados por espera (Priority: P1)

El cocinero abre la vista de cocina y queda identificado con la partida que tiene asignada (entrantes, principales o postres). La pantalla muestra únicamente los pedidos que aún están pendientes de preparar en su partida, sin mostrar los de las demás. Los pedidos aparecen ordenados por tiempo de espera: primero el más antiguo y al final el más reciente, para que el cocinero sepa siempre por dónde empezar.

**Why this priority**: Es el núcleo de la historia. Sin una lista filtrada por partida y ordenada por antigüedad, el cocinero no puede priorizar su trabajo ni saber qué le queda pendiente; el resto de la historia solo enriquece esta base.

**Independent Test**: Con varios pedidos pendientes repartidos entre las tres partidas, abrir la vista de cocina identificado con una partida concreta y comprobar que solo aparecen los pedidos de esa partida y que el orden va del más antiguo al más reciente.

**Acceptance Scenarios**:

1. **Given** un cocinero identificado con una partida y pedidos pendientes en varias partidas, **When** abre la vista de cocina, **Then** solo ve los pedidos pendientes de su partida y ninguno de las demás.
2. **Given** dos pedidos pendientes de la partida del cocinero enviados en momentos distintos, **When** se muestra la lista, **Then** el más antiguo aparece en primer lugar y el más reciente al final.
3. **Given** un cocinero cuya partida no tiene pedidos pendientes, **When** abre la vista de cocina, **Then** la lista aparece vacía y se indica que no hay pedidos pendientes.

---

### User Story 2 - Ver el tiempo de espera y el detalle de cada pedido (Priority: P2)

Junto a cada pedido pendiente, el cocinero ve cuánto tiempo ha transcurrido desde que se envió, para identificar de un vistazo qué conviene priorizar. Además, cada pedido muestra los platos que lo componen con sus cantidades, de forma que el cocinero sabe exactamente qué debe preparar sin preguntar a nadie.

**Why this priority**: Aporta la información necesaria para decidir y preparar (urgencia y contenido). Sin ella la lista seguiría siendo útil para saber qué queda, pero incompleta para trabajar.

**Independent Test**: Con al menos un pedido pendiente en la partida del cocinero, comprobar que la vista muestra el tiempo transcurrido desde su envío y la lista de platos con sus cantidades.

**Acceptance Scenarios**:

1. **Given** un pedido pendiente mostrado en la vista de cocina, **When** el cocinero lo observa, **Then** ve el tiempo transcurrido desde que el pedido se envió.
2. **Given** un pedido pendiente compuesto por varios platos, **When** se muestra, **Then** aparecen todos sus platos junto con la cantidad de cada uno.
3. **Given** un pedido pendiente que permanece en pantalla, **When** pasa el tiempo, **Then** el tiempo de espera mostrado refleja el tiempo real transcurrido.
4. **Given** un pedido pendiente con parte de sus platos ya marcados como listos, **When** el cocinero lo observa, **Then** ve todos sus platos y distingue visualmente cuáles ya están listos y cuáles quedan pendientes.
5. **Given** un pedido pendiente procedente de una mesa, **When** se muestra, **Then** el cocinero ve el identificador de la mesa de origen.

---

### User Story 3 - Mantener la lista actualizada durante el servicio (Priority: P3)

La vista se mantiene al día conforme avanza el servicio. Cuando llega un pedido nuevo desde sala para la partida del cocinero, aparece en la posición que le corresponde según su antigüedad. A medida que los pedidos dejan de estar pendientes, la lista se reordena automáticamente, de modo que el cocinero trabaja siempre sobre información vigente.

**Why this priority**: Garantiza que la información no quede obsoleta durante el servicio. Es valioso, pero la historia ya entrega valor con una lista correcta al abrirla, aunque no se refresque en vivo.

**Independent Test**: Con la vista de cocina abierta, enviar un nuevo pedido desde sala para la partida del cocinero y comprobar que aparece en el lugar que le corresponde; después marcar un pedido como no pendiente y comprobar que desaparece y el resto se reordena.

**Acceptance Scenarios**:

1. **Given** la vista de cocina abierta del cocinero, **When** llega un pedido nuevo desde sala para su partida, **Then** el pedido aparece en la lista en la posición que le corresponde por antigüedad.
2. **Given** un pedido pendiente que deja de estarlo, **When** cambia su estado, **Then** desaparece de la lista y los pedidos restantes se reordenan automáticamente.
3. **Given** varios pedidos pendientes y la llegada de uno nuevo, **When** se inserta en la lista, **Then** se mantiene el orden del más antiguo al más reciente.
4. **Given** la vista de cocina abierta, **When** los pedidos cambian, **Then** el cocinero no necesita recargar ni actualizar la pantalla manualmente.

---

### Edge Cases

- **Partida sin pedidos pendientes**: la vista muestra un estado vacío claro que indica que no hay pedidos pendientes, sin listar pedidos de otras partidas.
- **Cocinero sin partida asignada o partida desconocida**: la vista no puede mostrar una lista fiable; debe indicar que no hay partida asignada en lugar de mostrar pedidos de cualquier partida.
- **Empate en el tiempo de envío** de dos pedidos: se ordenan por orden de llegada (identificador creciente), de modo que la lista no cambia de orden sin motivo.
- **Esperas muy largas** (por ejemplo, más de una hora): el tiempo transcurrido se sigue mostrando de forma legible, sin cortarse ni desbordarse.
- **Pedido con un único plato**: se muestra igual que cualquier otro pedido, con su plato y cantidad.
- **Todos los platos de un pedido dejan de estar pendientes**: el pedido desaparece de la lista y no queda como pendiente.
- **Muchos pedidos pendientes a la vez**: la lista permite desplazarse y localizar el pedido más urgente con facilidad.
- **Interrupción momentánea de la conexión**: la vista muestra un indicador de "sin conexión" y marca la información como no actualizada; al restablecerse, recupera la información vigente sin duplicar ni perder pedidos.
- **Pedido cancelado o retirado desde sala**: deja de aparecer como pendiente en la vista de cocina.
- **Comanda editada tras el envío**: el pedido conserva su tiempo de espera original y mantiene su posición por antigüedad, aunque se indique que ha sido modificado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Al usar la vista de cocina, el cocinero MUST quedar identificado con la partida que tiene asignada.
- **FR-002**: La vista de cocina MUST mostrar únicamente los pedidos pendientes que corresponden a la partida del cocinero.
- **FR-003**: La vista de cocina MUST NOT mostrar pedidos pendientes de partidas distintas a la del cocinero.
- **FR-004**: Los pedidos MUST ordenarse por tiempo de espera, del más antiguo al más reciente; en caso de empate en el instante de envío, MUST ordenarse por orden de llegada (identificador creciente).
- **FR-005**: Cada pedido pendiente MUST mostrar el tiempo transcurrido desde que se envió originalmente, sin reiniciarse cuando la comanda se edita después (historia 02).
- **FR-006**: El tiempo transcurrido mostrado MUST mantenerse al día mientras el pedido sigue pendiente en pantalla.
- **FR-007**: Cada pedido pendiente MUST mostrar todos los platos que lo componen junto con la cantidad de cada uno, incluyendo los ya marcados como listos y distinguiéndolos visualmente de los que siguen pendientes.
- **FR-008**: Un pedido MUST considerarse pendiente mientras conserve al menos un plato sin completar dentro de la partida del cocinero.
- **FR-009**: La lista MUST actualizarse automáticamente cuando llega un pedido nuevo desde sala, sin que el cocinero realice ninguna acción manual.
- **FR-010**: Al llegar un pedido nuevo, este MUST insertarse en la posición que le corresponde según su antigüedad.
- **FR-011**: La lista MUST reordenarse automáticamente cuando un pedido deja de estar pendiente, sin que el cocinero realice ninguna acción manual.
- **FR-012**: Cuando la partida del cocinero no tenga pedidos pendientes, la vista MUST mostrar un estado vacío que lo indique.
- **FR-013**: Ante un cocinero sin partida asignada, la vista MUST indicar la ausencia de partida en lugar de mostrar pedidos de cualquier partida.
- **FR-014**: Todos los textos visibles de la vista (partidas, estado vacío, unidades de tiempo) MUST estar en español de España.
- **FR-015**: Una edición posterior de la comanda (historia 02) MUST NOT reiniciar el tiempo de espera del pedido ni alterar su posición por antigüedad.
- **FR-016**: Cada pedido pendiente MUST indicar la mesa de la que procede.

### Key Entities *(include if data involved)*

- **Cocinero**: persona que usa la vista de cocina; tiene asignada una única partida y solo ve los pedidos de esa partida.
- **Partida**: agrupación fija de la carta a la que pertenece un plato (entrantes, principales, postres); determina qué pedidos ve cada cocinero.
- **Pedido de cocina**: porción de una comanda enviada desde sala que corresponde a una partida y a una mesa; se caracteriza por el momento en que se envió y por su estado de pendiente o completado.
- **Línea de pedido**: plato incluido en un pedido con su cantidad y su partida; un pedido de cocina se compone de una o más líneas y sigue pendiente mientras alguna de ellas no esté completada.
- **Mesa**: mesa de sala de la que procede el pedido; identifica el origen del pedido durante el servicio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al abrir la vista de cocina, el 100% de los pedidos mostrados pertenece a la partida del cocinero (cero pedidos de otras partidas visibles).
- **SC-002**: En el 100% de los casos, el pedido pendiente más antiguo aparece en la primera posición de la lista y el más reciente en la última.
- **SC-003**: El 100% de los pedidos pendientes muestra el tiempo transcurrido desde su envío con una precisión de al menos un minuto.
- **SC-004**: El 100% de los pedidos pendientes muestra todos sus platos y la cantidad de cada uno.
- **SC-005**: Un pedido nuevo enviado desde sala aparece en la vista de cocina en 5 segundos o menos, sin que el cocinero tenga que recargar la pantalla.
- **SC-006**: Cuando un pedido deja de estar pendiente, desaparece de la lista y el resto se reordena en 5 segundos o menos, sin intervención del cocinero.
- **SC-007**: Un cocinero identifica correctamente qué debe preparar (pedido, platos y cantidades) en el 100% de los pedidos pendientes, sin ayuda externa.
- **SC-008**: Con 20 pedidos pendientes en la partida, el cocinero localiza el más urgente en 10 segundos o menos.
- **SC-009**: El 100% de los pedidos pendientes muestra la mesa de la que procede.

## Assumptions

- El cocinero ya dispone de una partida asignada antes de usar la vista; esta historia reutiliza la identidad/asignación existente y no introduce un inicio de sesión propio. La creación, asignación o cambio de partidas quedan fuera del alcance.
- Las partidas del restaurante son tres: entrantes, principales y postres.
- Un "pedido pendiente" es aquel que conserva al menos un plato sin completar en la partida del cocinero; marcar platos como listos se trata en la historia 04 y editar la comanda en la historia 02.
- Los pedidos proceden de comandas confirmadas en sala (historias 01 y 02) y llegan ya agrupados por partida.
- Se asume que la vista de cocina se usa en una pantalla de cocina con conectividad de red del local disponible durante el servicio.
- El tiempo de espera se muestra en minutos, y en horas cuando corresponda, siguiendo la convención española.
- No se incluye en esta historia marcar platos como listos, editar pedidos, ni la señal visual o auditiva para el camarero (historias 04 y 05).
- Ante pedidos con el mismo tiempo de envío, el desempate se resuelve por orden de llegada (identificador creciente), según FR-004.
