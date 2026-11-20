# Feature Specification: Editar un pedido enviado

**Feature Branch**: `feature/002-editar-comanda`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: ¿Cómo llega el cambio a cocina tras editar un pedido ya enviado? → A: El camarero debe pulsar explícitamente una acción de "enviar cambios" para que cocina reciba la modificación; no se envía sola al guardar.
- Q: ¿Cómo debe tratarse un plato retirado de un pedido ya enviado que cocina ya puede estar preparando? → A: El plato se retira del pedido vigente y deja de aparecer en el pedido; el cambio se comunica a cocina al enviar cambios.
- Q: ¿Qué camarero puede editar un pedido ya enviado? → A: Cualquier camarero identificado puede editar el pedido enviado de cualquier mesa.
- Q: Si dos camareros editan a la vez el mismo pedido ya enviado, ¿qué debe hacer el sistema? → A: El pedido se bloquea mientras un camarero lo edita; otro camarero no puede abrirlo hasta que el primero termine.
- Q: ¿La aplicación debe funcionar sin conexión o exige estar conectada a la red del restaurante? → A: Exige conexión: al perderse muestra un indicador de "sin conexión", no permite confirmar ni modificar y conserva lo escrito en pantalla hasta recuperarla.
- Q: ¿Cada mesa queda vinculada a un camarero concreto o cualquier camarero puede ver y atender cualquier mesa? → A: Todas las mesas son compartidas: cualquier camarero ve, atiende y recibe los avisos de cualquier mesa.
- Q: ¿Cómo debe entenderse que un pedido confirmado "no admite cambios directos" (historia 01)? → A: El pedido confirmado puede editarse directamente en cualquier momento, sin una acción previa de reapertura.
- Q: Si el precio de un plato cambia entre el pedido y el cierre de la cuenta, ¿qué precio se usa? → A: El precio del momento de pedir: queda fijado al tomar el pedido y no cambia después.

### Session 2026-10-20

- Q: Cuando un camarero bloquea un pedido para editarlo, ¿qué acciones deben liberar ese bloqueo, incluido el caso de que abandone la edición sin guardar? (FR-015) → A: Se libera al enviar los cambios, al cancelar o salir de la edición y automáticamente tras un periodo de inactividad.

### Session 2026-11-03

- Q: Cuando un cliente cancela un pedido que ya se envió a cocina, ¿qué debe permitir el sistema? → A: Cancelar el pedido completo desde sala, avisar a cocina, retirarlo de la vista y liberar la mesa; no se cobra.
- Q: Si una línea ya marcada como lista por cocina cambia de cantidad en una edición, ¿qué pasa con su estado de preparación? → A: Si la cantidad baja o se mantiene, sigue lista; si sube, vuelve a pendiente y se borra el momento de listo (regla detallada en la historia 004).
- Q: Mientras un camarero tiene un pedido bloqueado para editarlo, ¿puede cocina seguir marcando o desmarcando sus platos como listos? → A: No: el bloqueo se extiende a cocina; al enviar o cancelar los cambios, se libera y cocina trabaja sobre el estado resultante.
- Q: Si un plato de un pedido ya enviado deja de estar disponible en la carta, ¿se retira automáticamente? → A: No; la baja solo afecta a pedidos nuevos. El camarero puede retirarlo o cancelar el pedido.
- Q: Cuando se edita un pedido ya enviado, ¿qué debe guardar el sistema: solo la marca de «modificado» o un registro detallado de cada cambio? → A: Un registro por modificación con el tipo de cambio, el momento y el usuario; cocina solo muestra el aviso «Modificado».

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Editar un pedido ya enviado (Priority: P1)

En pleno servicio, después de haber enviado el pedido, un cliente cambia de opinión: pide que se
retire un ingrediente, añade un plato a última hora o decide que ya no quiere algo. El camarero abre
el pedido que ya había sido enviado y lo modifica sobre la marcha, sin tener que crear un
pedido nuevo que duplique el pedido. Los cambios se aplican sobre el mismo pedido y quedan
asociados a esa mesa. Como el pedido ya había llegado a cocina, el cambio queda marcado como una
modificación del pedido original, de forma que se distingue de un pedido nuevo y no se confunde
con el anterior. Si el cliente cancela el pedido completo, el camarero puede anularlo y avisar a
cocina.

**Why this priority**: los cambios de última hora son constantes en sala; sin poder corregir una
pedido ya enviado, el camarero tendría que duplicar pedidos y cocina recibiría información
errónea o contradictoria.

**Independent Test**: puede probarse de principio a fin enviando un pedido, editándola,
añadiendo y retirando platos y ajustando cantidades o indicaciones, y comprobando que los cambios
quedan sobre el mismo pedido, marcado como modificado y vinculado a la misma mesa.

**Acceptance Scenarios**:

1. **Dado** un pedido ya enviado de una mesa, **cuando** el camarero lo abre para editarlo,
   **entonces** el pedido admite modificaciones directamente.
2. **Dado** un pedido ya enviado abierto para edición, **cuando** el camarero añade un plato
   nuevo, **entonces** el plato se incorpora al pedido existente.
3. **Dado** un pedido ya enviado abierto para edición, **cuando** el camarero retira un plato,
   **entonces** el plato desaparece del pedido existente.
4. **Dado** un pedido ya enviado abierto para edición, **cuando** el camarero ajusta la
   cantidad de un plato o corrige una indicación, **entonces** el pedido refleja el cambio.
5. **Dado** un pedido que ha sido editado, **cuando** el camarero lo consulta, **entonces** el
   pedido figura marcado como modificado y distinto de un pedido nuevo.
6. **Dado** un pedido ya enviado que se ha editado, **cuando** el camarero lo consulta,
   **entonces** sigue siendo un único pedido vinculado a la misma mesa.
7. **Dado** un pedido ya editado cuyos cambios aún no se han comunicado, **cuando** el camarero
   ejecuta la acción de enviar cambios, **entonces** cocina recibe la modificación marcada como
   tal.
8. **Dado** un pedido bloqueado por un camarero que abandona la edición sin enviar cambios,
   **cuando** ese camarero cancela o sale de la edición, o transcurre el periodo de inactividad,
   **entonces** el bloqueo se libera y otro camarero puede abrir el pedido.
9. **Dado** un pedido ya enviado con platos, **cuando** el camarero cancela el pedido completo,
   **entonces** el pedido deja de estar vigente, desaparece de la vista de cocina y de sala, la mesa
   queda libre si no tiene otra comanda y no se genera ningún cobro.

---

### Edge Cases

- ¿Qué ocurre si el camarero abre para editar un pedido enviado y no realiza ningún cambio? El pedido
  debe conservar su estado sin quedar marcado como modificado innecesariamente.
- ¿Qué ocurre si el camarero retira todos los platos de un pedido ya enviado? El sistema debe
  impedir dejar el pedido sin ningún plato o exigir una acción explícita de cancelación del pedido
  completo (FR-016) en lugar de guardarlo vacío.
- ¿Qué ocurre si el camarero modifica el pedido mientras cocina ya está preparando el pedido?
  El pedido debe seguir reflejando su estado actualizado y la modificación debe quedar marcada
  como tal.
- ¿Qué ocurre si la conexión se interrumpe al guardar una edición? El sistema muestra un indicador
  de "sin conexión", no permite guardar la edición y conserva en pantalla los cambios no aplicados
  hasta que se recupere la conexión.
- ¿Qué ocurre si el camarero intenta editar un pedido que ya no está enviado (por ejemplo, ya
  cerrada)? El sistema debe impedir la edición y avisar de que el pedido no admite cambios.
- ¿Qué ocurre si el camarero intenta editar un pedido cuya cuenta ya tiene una parte pagada? La
  edición se bloquea hasta que se deshaga el pago según la historia 006.
- ¿Qué ocurre si un camarero intenta editar un pedido que otro camarero tiene abierta? El
  sistema debe impedir el acceso simultáneo e indicar que el pedido está siendo editado.
- ¿Qué ocurre si un camarero abandona la edición sin enviar los cambios? El bloqueo se libera al
  cancelar o salir de la edición, o al expirar el periodo de inactividad, sin marcar el pedido
  como modificado.
- ¿Qué ocurre si el cliente cancela todo el pedido ya enviado? El camarero puede cancelarlo
  completo: deja de estar vigente, desaparece de cocina y de sala, la mesa queda libre si no tiene
  otra comanda y no se genera ningún cobro.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema MUST permitir a cualquier camarero identificado editar directamente la
  pedido ya enviado de cualquier mesa, sin una acción previa de reapertura.
- **FR-002**: El sistema MUST permitir añadir platos nuevos a un pedido ya enviado.
- **FR-003**: El sistema MUST permitir retirar platos de un pedido ya enviado, quedando el plato
  retirado fuera del pedido vigente y dejando de aparecer en el pedido. La retirada es una acción
  manual del camarero; un cambio de disponibilidad en la carta MUST NOT retirar automáticamente
  platos de pedidos ya enviados (aclarado en la sesión de clarificación).
- **FR-004**: El sistema MUST permitir modificar la cantidad de un plato de un pedido ya
  enviado. Si la línea ya estaba marcada como lista, MUST aplicarse la regla de la historia 004:
  sigue lista si la cantidad baja o se mantiene, y vuelve a pendiente, borrando el momento de
  listo, si la cantidad sube (aclarado en la sesión de clarificación).
- **FR-005**: El sistema MUST permitir corregir las indicaciones de un plato de un pedido ya
  enviado. Las indicaciones se crean al añadir el plato al pedido en la historia 001; esta historia
  solo las corrige (aclarado en la sesión de clarificación de la historia 001).
- **FR-006**: El sistema MUST aplicar los cambios sobre el pedido original, sin crear un
  pedido nuevo ni duplicar el pedido.
- **FR-007**: El sistema MUST mantener el pedido editado vinculado a la misma mesa que tenía.
- **FR-008**: El sistema MUST conservar la identidad del pedido tras la edición (sigue siendo
  el mismo pedido, actualizado).
- **FR-009**: El sistema MUST marcar el pedido como modificado cuando se edita tras haber sido
  enviado, de forma que se distinga de un pedido nuevo.
- **FR-010**: El sistema MUST reflejar siempre el estado actualizado del pedido tras la
  edición.
- **FR-011**: El sistema MUST impedir dejar un pedido ya enviado sin ningún plato como
  resultado de una edición.
- **FR-012**: El sistema MUST impedir editar un pedido que no esté en estado `enviada` (por ejemplo,
  `cerrada` o `cancelada`); la edición de un pedido en curso se realiza por el flujo de la historia
  001.
- **FR-013**: El sistema MUST registrar cada modificación del pedido con el tipo de cambio, el
  momento y el usuario que la realizó, de manera que quede trazabilidad frente al pedido original.
  El detalle MUST NOT ser necesario en la vista de cocina, que solo muestra el aviso «Modificado»
  (aclarado en la sesión de clarificación).
- **FR-014**: El sistema MUST requerir que el camarero ejecute explícitamente una acción de enviar
  los cambios para que cocina reciba la modificación; la edición no se comunica sola al guardar.
- **FR-015**: El sistema MUST bloquear el pedido mientras un camarero la está editando, de modo
  que otro camarero no pueda editarlo simultáneamente hasta que el primero termine. El bloqueo
  MUST liberarse al enviar los cambios, al cancelar o salir de la edición y automáticamente tras
  un periodo de inactividad (valor concreto a fijar en planificación). Mientras el bloqueo esté
  activo, cocina MUST NOT poder marcar ni desmarcar como listos los platos de ese pedido; al
  liberarse, cocina MUST trabajar sobre el estado resultante de los cambios (aclarado en la
  sesión de clarificación).
- **FR-016**: El camarero MUST poder cancelar un pedido completo ya enviado a cocina. Al
  cancelarlo, el pedido MUST dejar de estar vigente, MUST retirarse de la vista de cocina y de
  sala, la mesa MUST quedar libre si no tiene otra comanda y MUST NOT generar consumo ni cobro.
  La cancelación MUST comunicarse a cocina y MUST distinguirse de una edición (aclarado en la
  sesión de clarificación).

### Key Entities _(include if feature involves data)_

- **Pedido**: pedido tomado para una mesa. Atributos relevantes: mesa asociada, estado (en curso,
  enviada, cerrada o cancelada), platos que lo componen y marca de modificado.
- **Línea de pedido**: cada plato dentro de un pedido. Atributos relevantes: plato, cantidad,
  indicaciones y el precio del plato en el momento de pedirlo.
- **Modificación de pedido**: cambio realizado sobre un pedido previamente enviado. Atributos
  relevantes: pedido afectado, tipo de cambio (añadir, retirar, ajustar cantidad, corregir o
  cancelar el pedido), momento del cambio y usuario que lo realizó.
- **Mesa**: puesto del restaurante al que queda vinculado al pedido. Atributos relevantes:
  identificación de la mesa y estado.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Un camarero puede editar un pedido ya enviado, añadir o retirar un plato y
  confirmar el cambio en menos de 1 minuto.
- **SC-002**: El 100% de las ediciones se aplican sobre el pedido original, generando 0 pedidos
  nuevas o duplicadas.
- **SC-003**: El 100% de los pedidos editados quedan marcados como modificados, de forma que
  nunca se confunden con un pedido nuevo.
- **SC-005**: Ninguna edición deja un pedido enviado sin platos (0 pedidos vacíos tras
  edición).
- **SC-006**: El 100% de las modificaciones llegan a cocina solo después de que el camarero haya
  ejecutado la acción de enviar cambios (0 envíos automáticos al guardar).
- **SC-007**: El 100% de los bloqueos se libera al enviar los cambios, al cancelar o salir de la
  edición, o al expirar el periodo de inactividad; ningún pedido queda bloqueado indefinidamente.
- **SC-008**: El 100% de los pedidos cancelados desaparece de cocina y de sala, libera la mesa si
  no tiene otra comanda y no genera ningún cobro.
- **SC-009**: El 100% de las modificaciones queda registrada con su tipo, momento y usuario; la
  vista de cocina solo muestra el aviso «Modificado».

> Nota: la numeración conserva el hueco de SC-004 para mantener estables los identificadores
> usados en planes, contratos y quickstarts.

## Assumptions

- El pedido que se edita ya existe y fue enviado previamente con al menos una partida (historia
  01); la toma inicial del pedido no forma parte de esta especificación.
- La mesa a la que pertenece el pedido ya se abrió previamente; abrir mesas y tomar pedidos es
  objeto de otra historia.
- El pedido mantiene su vínculo con la mesa aunque se modifiquen sus platos.
- La cancelación de un pedido completo ya enviado se realiza desde sala, se comunica a cocina y
  no genera consumo facturable; si cocina ya había preparado algún plato, no se cobra.
- Las señales visuales o sonoras al camarero sobre el estado de los platos (historia 05) y el
  flujo de cocina (historias 03 y 04) son objeto de otras historias y no forman parte de esta
  especificación.
- Métrica de negocio posterior al lanzamiento (no forma parte de los criterios de éxito verificables
  en la aplicación): el 95% de los camareros completará una edición de pedido al primer intento, sin
  ayuda.
