# Feature Specification: Abrir mesa y tomar comanda

**Feature Branch**: `001-comandas`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: ¿La aplicación debe funcionar sin conexión o exige estar conectada a la red del restaurante? → A: Exige conexión: al perderse muestra un indicador de "sin conexión", no permite confirmar ni modificar y conserva lo escrito en pantalla hasta recuperarla.
- Q: ¿Cómo debe entenderse que una comanda confirmada "no admite cambios directos"? → A: La comanda confirmada puede editarse directamente en cualquier momento, sin una acción previa de reapertura (el detalle de la edición corresponde a la historia 02).
- Q: Si el precio de un plato cambia entre el pedido y el cierre de la cuenta, ¿qué precio se usa? → A: El precio del momento de pedir: queda fijado al tomar la comanda y no cambia después.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Abrir una mesa y tomar la comanda plato a plato (Priority: P1)

El camarero, tableta en mano, llega a una mesa recién ocupada y la abre en la aplicación. A
continuación va añadiendo los platos que le piden, uno a uno, con su cantidad, tomándolos de la
carta del restaurante. Cada plato queda encajado automáticamente en su partida (entrantes,
principales o postres), de forma que la comanda se ve ya agrupada por partidas. Antes de cerrar,
revisa lo anotado, ajusta cantidades y repite platos si hace falta. Cuando el cliente ha terminado
de pedir, el camarero confirma la comanda, momento en el que el pedido sale hacia el resto del
sistema ya ordenado por partidas y queda registrado como comanda enviada de esa mesa.

**Why this priority**: es el punto de entrada de todo el servicio; sin poder abrir la mesa y
tomar la comanda no se genera ningún pedido y el resto del sistema no tiene nada que procesar.

**Independent Test**: puede probarse de principio a fin abriendo una mesa, añadiendo platos de
distintas partidas, ajustando cantidades antes de confirmar, confirmando la comanda y comprobando
que la comanda queda registrada como enviada, vinculada a la mesa y agrupada por partidas.

**Acceptance Scenarios**:

1. **Dado** una mesa ocupada y sin comanda en curso, **cuando** el camarero abre esa mesa,
   **entonces** la mesa queda marcada como ocupada y se inicia una comanda asociada a ella.
2. **Dado** una mesa abierta con una comanda en curso, **cuando** el camarero añade un plato con
   su cantidad, **entonces** el plato aparece en la comanda dentro de su partida correspondiente.
3. **Dado** una comanda en curso con platos en varias partidas, **cuando** el camarero la revisa,
   **entonces** ve los platos agrupados por entrantes, principales y postres.
4. **Dado** una comanda en curso, **cuando** el camarero ajusta la cantidad de un plato o repite
   un plato, **entonces** la comanda refleja el cambio antes de confirmarse.
5. **Dado** una comanda en curso sin confirmar, **cuando** el camarero confirma la comanda,
   **entonces** la comanda pasa a estado enviada, queda vinculada a su mesa y el pedido se remite
   agrupado por partidas.
6. **Dado** una comanda ya confirmada, **cuando** el camarero la consulta, **entonces** la
   comanda figura como enviada y sigue vinculada a su mesa.

---

### Edge Cases

- ¿Qué ocurre si el camarero abre una mesa que ya tiene una comanda en curso? El sistema no debe
  crear una segunda comanda para la misma mesa.
- ¿Qué ocurre si el camarero intenta confirmar una comanda sin ningún plato? El sistema debe
  impedir confirmar una comanda vacía e indicárselo al camarero.
- ¿Qué ocurre si el camarero añade el mismo plato varias veces? El sistema debe permitir repetir
  platos iguales conservando la cantidad solicitada de cada uno.
- ¿Qué ocurre si la conexión se interrumpe durante la toma de la comanda? El sistema muestra un
  indicador de "sin conexión", no permite confirmar la comanda y conserva los platos ya anotados
  en pantalla hasta que se recupere la conexión.
- ¿Qué ocurre si el camarero quiere corregir un plato antes de confirmar? Debe poder modificar
  cantidades y repetir o retirar platos mientras la comanda no se haya confirmado.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema DEBE permitir al camarero abrir una mesa indicando que está ocupada.
- **FR-002**: El sistema DEBE permitir seleccionar sobre qué mesa se toma la comanda.
- **FR-003**: El sistema DEBE registrar como ocupada la mesa que se abre.
- **FR-004**: El sistema DEBE iniciar una comanda en curso vinculada a la mesa abierta.
- **FR-005**: El sistema DEBE impedir que exista más de una comanda abierta para la misma mesa.
- **FR-006**: El sistema DEBE permitir al camarero añadir platos a la comanda uno a uno,
  indicando la cantidad de cada plato.
- **FR-007**: El sistema DEBE tomar los platos disponibles de la carta vigente del restaurante.
- **FR-008**: El sistema DEBE permitir repetir el mismo plato varias veces dentro de una comanda.
- **FR-009**: El sistema DEBE asignar automáticamente cada plato a su partida correspondiente
  (entrantes, principales o postres).
- **FR-010**: El sistema DEBE mostrar la comanda agrupada por partidas (entrantes, principales,
  postres).
- **FR-011**: El sistema DEBE permitir modificar la cantidad de un plato de la comanda mientras
  esta no se haya confirmado.
- **FR-012**: El sistema DEBE permitir retirar un plato de la comanda mientras esta no se haya
  confirmado.
- **FR-013**: El sistema DEBE permitir al camarero confirmar la comanda.
- **FR-014**: El sistema DEBE impedir confirmar una comanda que no contenga ningún plato.
- **FR-015**: El sistema DEBE registrar la comanda como enviada al confirmarla.
- **FR-016**: El sistema DEBE remitir el pedido agrupado por partidas al confirmar la comanda.
- **FR-017**: El sistema DEBE mantener la comanda vinculada a su mesa tras la confirmación.
- **FR-018**: El sistema DEBE permitir modificar una comanda ya confirmada directamente, sin una
  acción previa de reapertura (el detalle de la edición corresponde a la historia 02).
- **FR-019**: El sistema DEBE fijar el precio de cada plato en el momento de pedirlo, de modo que
  un cambio posterior del precio en la carta no altere el importe de la comanda.

### Key Entities _(include if feature involves data)_

- **Mesa**: puesto del restaurante que el camarero abre y al que se asocia la comanda. Atributos
  relevantes: identificación de la mesa y estado (libre u ocupada).
- **Comanda**: pedido tomado para una mesa. Atributos relevantes: mesa asociada, estado (en curso
  o enviada), platos que la componen y momento de confirmación.
- **Línea de comanda**: cada plato anotado dentro de una comanda. Atributos relevantes: plato,
  cantidad, partida a la que pertenece y el precio del plato en el momento de pedirlo.
- **Plato**: artículo de la carta del restaurante que se puede pedir. Atributos relevantes:
  nombre y partida a la que pertenece.
- **Partida**: agrupación por la que se ordena el pedido: entrantes, principales y postres.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Un camarero puede abrir una mesa y confirmar una comanda de al menos tres platos,
  repartidos entre las tres partidas, en menos de 2 minutos.
- **SC-002**: El 100% de las comandas confirmadas llegan al resto del sistema agrupadas por
  partidas, sin platos de una partida mezclados con otra.
- **SC-003**: No se genera ninguna comanda duplicada mientras una mesa tiene una comanda en curso
  (0 comandas duplicadas por mesa abierta).
- **SC-004**: El 95% de los camareros completa el proceso de abrir una mesa y confirmar su primera
  comanda al primer intento, sin ayuda.
- **SC-005**: Ningún plato anotado en una comanda en curso se pierde al confirmarla (100% de los
  platos anotados aparecen en la comanda enviada).

## Assumptions

- El restaurante dispone de una carta con los platos ya definidos y cada plato pertenece a una de
  las tres partidas (entrantes, principales o postres).
- Cada mesa se identifica de forma única dentro del local.
- El camarero que toma la comanda está identificado en la aplicación.
- Una mesa tiene como máximo una comanda en curso a la vez; la edición de comandas ya enviadas
  (historia 02) es objeto de otra historia y no forma parte de esta especificación.
- La disponibilidad de los platos de la carta la gestiona otra historia (historia 08); aquí se da
  por hecho que los platos que se ofrecen están disponibles.
