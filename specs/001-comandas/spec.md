# Feature Specification: Abrir mesa y tomar pedido

**Feature Branch**: `feature/001-comandas`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: ¿La aplicación debe funcionar sin conexión o exige estar conectada a la red del restaurante? → A: Exige conexión: al perderse muestra un indicador de "sin conexión", no permite confirmar ni modificar y conserva lo escrito en pantalla hasta recuperarla.
- Q: Si el precio de un plato cambia entre el pedido y el cierre de la cuenta, ¿qué precio se usa? → A: El precio del momento de pedir: queda fijado al tomar el pedido y no cambia después.

### Session 2026-10-20

- Q: Si el cliente se marcha o cambia de idea antes de confirmar el pedido, ¿qué debe poder hacer el camarero con ese pedido en curso y con la mesa? (FR-004, FR-005) → A: Anular el pedido en curso; el pedido se descarta, la mesa vuelve a quedar libre y nada se envía a cocina.

### Session 2026-11-03

- Q: ¿La anulación de un pedido ya enviado a cocina se rige por la historia 001 o por la 002? → A: Por la 002: se cancela el pedido completo desde sala, se avisa a cocina y la mesa queda libre; la 001 solo cubre la anulación antes de confirmar.
- Q: Si un plato deja de estar disponible después de confirmar el pedido, ¿se retira del pedido enviado? → A: No; la baja solo afecta a pedidos nuevos. Si no se puede preparar, el camarero lo retira o cancela el pedido según la historia 002.
- Q: ¿Dónde debe poder añadirse una indicación o nota a un plato: al tomar el pedido en la historia 001, solo al editarlo en la 002, o en ambos momentos? → A: En ambos: se añade al tomar el pedido y se puede corregir al editarlo; es el mismo dato de la línea.
- Q: Cuando el dashboard muestra un día pasado, ¿debe usar los datos actuales del plato (nombre y partida) o los que tenía cuando se pidió? → A: Los que tenía al pedir: la línea guarda una instantánea de nombre y partida, igual que el precio.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Abrir una mesa y tomar el pedido plato a plato (Priority: P1)

El camarero, tableta en mano, llega a una mesa recién ocupada y la abre en la aplicación. A
continuación va añadiendo los platos que le piden, uno a uno, con su cantidad, tomándolos de la
carta del restaurante. Cada plato queda encajado automáticamente en su partida (entrantes,
principales o postres), de forma que el pedido se ve ya agrupado por partidas. Antes de cerrar,
revisa lo anotado, ajusta cantidades y repite platos si hace falta. Cuando el cliente ha terminado
de pedir, el camarero confirma el pedido, momento en el que el pedido sale hacia el resto del
sistema ya ordenado por partidas y queda registrado como pedido enviado de esa mesa.

**Why this priority**: es el punto de entrada de todo el servicio; sin poder abrir la mesa y
tomar el pedido no se genera ningún pedido y el resto del sistema no tiene nada que procesar.

**Independent Test**: puede probarse de principio a fin abriendo una mesa, añadiendo platos de
distintas partidas, ajustando cantidades antes de confirmar, confirmando el pedido y comprobando
que el pedido queda registrado como `enviada`, vinculado a la mesa y agrupado por partidas.

**Acceptance Scenarios**:

1. **Dado** una mesa ocupada y sin pedido en curso, **cuando** el camarero abre esa mesa,
   **entonces** la mesa queda marcada como ocupada y se inicia un pedido asociado a ella.
2. **Dado** una mesa abierta con un pedido en curso, **cuando** el camarero añade un plato con
   su cantidad, **entonces** el plato aparece en el pedido dentro de su partida correspondiente.
3. **Dado** un pedido en curso con platos en varias partidas, **cuando** el camarero lo revisa,
   **entonces** ve los platos agrupados por entrantes, principales y postres.
4. **Dado** un pedido en curso, **cuando** el camarero ajusta la cantidad de un plato o repite
   un plato, **entonces** el pedido refleja el cambio antes de confirmarse.
5. **Dado** un pedido en curso sin confirmar, **cuando** el camarero confirma el pedido,
   **entonces** el pedido pasa a estado `enviada`, queda vinculado a su mesa y el pedido se remite
   agrupado por partidas.
6. **Dado** un pedido ya confirmado, **cuando** el camarero lo consulta, **entonces** el
   pedido figura como `enviada` y sigue vinculado a su mesa.
7. **Dado** un pedido en curso de una mesa, **cuando** el camarero anula el pedido,
   **entonces** el pedido se descarta, la mesa vuelve a quedar libre y nada se envía a cocina.
8. **Dado** un pedido en curso, **cuando** el camarero añade un plato con una indicación o nota,
   **entonces** la indicación queda asociada a esa línea y se muestra con el plato en el pedido.
9. **Dado** un pedido confirmado, **cuando** el administrador cambia el nombre o la partida de un
   plato en la carta, **entonces** el pedido conserva el nombre y la partida que tenía al pedirse.

---

### Edge Cases

- ¿Qué ocurre si el camarero abre una mesa que ya tiene un pedido en curso? El sistema no debe
  crear un segundo pedido para la misma mesa.
- ¿Qué ocurre si el camarero intenta confirmar un pedido sin ningún plato? El sistema debe
  impedir confirmar un pedido vacío e indicárselo al camarero.
- ¿Qué ocurre si el camarero añade el mismo plato varias veces? El sistema debe permitir repetir
  platos iguales conservando la cantidad solicitada de cada uno.
- ¿Qué ocurre si la conexión se interrumpe durante la toma del pedido? El sistema muestra un
  indicador de "sin conexión", no permite confirmar el pedido y conserva los platos ya anotados
  en pantalla hasta que se recupere la conexión.
- ¿Qué ocurre si el camarero quiere corregir un plato antes de confirmar? Debe poder modificar
  cantidades y repetir o retirar platos mientras el pedido no se haya confirmado.
- ¿Qué ocurre si el cliente se marcha o cambia de idea antes de confirmar? El camarero puede
  anular el pedido en curso: se descarta, la mesa vuelve a quedar libre y no se envía nada a
  cocina.
- ¿Qué ocurre si el cliente cancela un pedido ya enviado a cocina? Se usa la cancelación de
  pedido completo de la historia 002: el pedido se retira de cocina y de sala, la mesa queda libre
  si no tiene otra comanda y no se cobra.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema MUST permitir al camarero abrir una mesa indicando que está ocupada.
- **FR-002**: El sistema MUST permitir seleccionar sobre qué mesa se toma el pedido.
- **FR-003**: El sistema MUST registrar como ocupada la mesa que se abre.
- **FR-004**: El sistema MUST iniciar un pedido en curso vinculado a la mesa abierta.
- **FR-005**: El sistema MUST impedir que exista más de un pedido abierto para la misma mesa.
- **FR-006**: El sistema MUST permitir al camarero añadir platos al pedido uno a uno,
  indicando la cantidad de cada plato y, opcionalmente, una indicación o nota por plato
  (aclarado en la sesión de clarificación).
- **FR-007**: El sistema MUST tomar los platos disponibles de la carta vigente del restaurante.
- **FR-008**: El sistema MUST permitir repetir el mismo plato varias veces dentro de un pedido.
- **FR-009**: El sistema MUST asignar automáticamente cada plato a su partida correspondiente
  (entrantes, principales o postres).
- **FR-010**: El sistema MUST mostrar el pedido agrupado por partidas (entrantes, principales,
  postres).
- **FR-011**: El sistema MUST permitir modificar la cantidad de un plato del pedido mientras
  esta no se haya confirmado.
- **FR-012**: El sistema MUST permitir retirar un plato del pedido mientras esta no se haya
  confirmado.
- **FR-013**: El sistema MUST permitir al camarero confirmar el pedido.
- **FR-014**: El sistema MUST impedir confirmar un pedido que no contenga ningún plato.
- **FR-015**: El sistema MUST registrar el pedido como `enviada` al confirmarlo.
- **FR-016**: El sistema MUST dejar el pedido agrupado por partidas disponible para el resto del
  sistema (la API interna que consumirá la vista de cocina) al confirmar el pedido.
- **FR-017**: El sistema MUST mantener el pedido vinculado a su mesa tras la confirmación.
- **FR-018**: El sistema MUST fijar el precio de cada plato en el momento de pedirlo, de modo que
  un cambio posterior del precio en la carta no altere el importe del pedido. También MUST fijar el
  nombre y la partida del plato en ese momento, para preservar el histórico aunque la carta cambie
  después (aclarado en la sesión de clarificación).
- **FR-019**: El camarero MUST poder anular un pedido en curso; al anularlo, el pedido se descarta,
  la mesa vuelve a quedar libre y el pedido MUST NOT enviarse a cocina.

### Key Entities _(include if feature involves data)_

- **Mesa**: puesto del restaurante que el camarero abre y al que se asocia el pedido. Atributos
  relevantes: identificación de la mesa y estado (libre u ocupada).
- **Pedido**: pedido tomado para una mesa. Atributos relevantes: mesa asociada, estado (en curso
  o enviada), platos que la componen y momento de confirmación.
- **Línea de pedido**: cada plato anotado dentro de un pedido. Atributos relevantes: plato,
  cantidad, nombre y partida del plato en el momento de pedirlo, el precio en ese momento y una
  indicación o nota opcional.
- **Plato**: artículo de la carta del restaurante que se puede pedir. Atributos relevantes:
  nombre y partida a la que pertenece.
- **Partida**: agrupación por la que se ordena el pedido: entrantes, principales y postres.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Un camarero puede abrir una mesa y confirmar un pedido de al menos tres platos,
  repartidos entre las tres partidas, en menos de 2 minutos.
- **SC-002**: El 100% de los pedidos confirmados llegan al resto del sistema agrupados por
  partidas, sin platos de una partida mezclados con otra.
- **SC-003**: No se genera ningún pedido duplicado mientras una mesa tiene un pedido en curso
  (0 pedidos duplicados por mesa abierta).
- **SC-005**: Ningún plato anotado en un pedido en curso se pierde al confirmarlo (100% de los
  platos anotados aparecen en el pedido enviado).
- **SC-006**: El 100% de las anulaciones deja la mesa libre y sin pedido en curso, y ningún
  pedido anulado llega a cocina.
- **SC-007**: El 100% de las indicaciones añadidas al pedir se conserva en su línea y se muestra
  con el plato en el pedido.
- **SC-008**: El 100% de las líneas conserva el nombre, la partida y el precio del momento de
  pedir, aunque la carta cambie después.

> Nota: la numeración conserva el hueco de SC-004 para mantener estables los identificadores
> usados en planes, contratos y quickstarts.

## Assumptions

- El restaurante dispone de una carta con los platos ya definidos y cada plato pertenece a una de
  las tres partidas (entrantes, principales o postres).
- Cada mesa se identifica de forma única dentro del local.
- El camarero que toma el pedido está identificado en la aplicación.
- Una mesa tiene como máximo un pedido en curso a la vez; la edición y la cancelación de pedidos
  ya enviados (historia 02) son objeto de otra historia y no forman parte de esta especificación.
  La 001 solo cubre la anulación antes de la confirmación.
- La disponibilidad de los platos de la carta la gestiona otra historia (historia 08); aquí se da
  por hecho que los platos que se ofrecen están disponibles. Un cambio posterior de disponibilidad
  no altera los pedidos ya confirmados; su tratamiento se rige por la historia 002.
- Métrica de negocio posterior al lanzamiento (no forma parte de los criterios de éxito verificables
  en la aplicación): el 95% de los camareros completará abrir una mesa y confirmar su primer pedido
  al primer intento, sin ayuda.
