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

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Editar un pedido ya enviado (Priority: P1)

En pleno servicio, después de haber enviado el pedido, un cliente cambia de opinión: pide que se
retire un ingrediente, añade un plato a última hora o decide que ya no quiere algo. El camarero abre
el pedido que ya había sido enviado y lo modifica sobre la marcha, sin tener que crear un
pedido nuevo que duplique el pedido. Los cambios se aplican sobre el mismo pedido y quedan
asociados a esa mesa. Como el pedido ya había llegado a cocina, el cambio queda marcado como una
modificación del pedido original, de forma que se distingue de un pedido nuevo y no se confunde
con el anterior.

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

---

### Edge Cases

- ¿Qué ocurre si el camarero abre para editar un pedido enviado y no realiza ningún cambio? El pedido
  debe conservar su estado sin quedar marcado como modificado innecesariamente.
- ¿Qué ocurre si el camarero retira todos los platos de un pedido ya enviado? El sistema debe
  impedir dejar el pedido sin ningún plato o exigir una acción explícita (por ejemplo, cancelar
  el pedido) en lugar de guardarla vacía.
- ¿Qué ocurre si el camarero modifica el pedido mientras cocina ya está preparando el pedido?
  El pedido debe seguir reflejando su estado actualizado y la modificación debe quedar marcada
  como tal.
- ¿Qué ocurre si la conexión se interrumpe al guardar una edición? El sistema muestra un indicador
  de "sin conexión", no permite guardar la edición y conserva en pantalla los cambios no aplicados
  hasta que se recupere la conexión.
- ¿Qué ocurre si el camarero intenta editar un pedido que ya no está enviado (por ejemplo, ya
  cerrada)? El sistema debe impedir la edición y avisar de que el pedido no admite cambios.
- ¿Qué ocurre si un camarero intenta editar un pedido que otro camarero tiene abierta? El
  sistema debe impedir el acceso simultáneo e indicar que el pedido está siendo editado.
- ¿Qué ocurre si un camarero abandona la edición sin enviar los cambios? El bloqueo se libera al
  cancelar o salir de la edición, o al expirar el periodo de inactividad, sin marcar el pedido
  como modificado.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema MUST permitir a cualquier camarero identificado editar directamente la
  pedido ya enviado de cualquier mesa, sin una acción previa de reapertura.
- **FR-002**: El sistema MUST permitir añadir platos nuevos a un pedido ya enviado.
- **FR-003**: El sistema MUST permitir retirar platos de un pedido ya enviado, quedando el plato
  retirado fuera del pedido vigente y dejando de aparecer en el pedido.
- **FR-004**: El sistema MUST permitir modificar la cantidad de un plato de un pedido ya
  enviado.
- **FR-005**: El sistema MUST permitir corregir las indicaciones de un plato de un pedido ya
  enviado.
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
  `cerrada`); la edición de un pedido en curso se realiza por el flujo de la historia 001.
- **FR-013**: El sistema MUST registrar que el pedido ha sido modificado, de manera que quede
  trazabilidad del cambio frente al pedido original.
- **FR-014**: El sistema MUST requerir que el camarero ejecute explícitamente una acción de enviar
  los cambios para que cocina reciba la modificación; la edición no se comunica sola al guardar.
- **FR-015**: El sistema MUST bloquear el pedido mientras un camarero la está editando, de modo
  que otro camarero no pueda editarlo simultáneamente hasta que el primero termine. El bloqueo
  MUST liberarse al enviar los cambios, al cancelar o salir de la edición y automáticamente tras
  un periodo de inactividad (valor concreto a fijar en planificación).

### Key Entities _(include if feature involves data)_

- **Pedido**: pedido tomado para una mesa. Atributos relevantes: mesa asociada, estado (en curso,
  enviada o cerrada), platos que lo componen y marca de modificado.
- **Línea de pedido**: cada plato dentro de un pedido. Atributos relevantes: plato, cantidad,
  indicaciones y el precio del plato en el momento de pedirlo.
- **Modificación de pedido**: cambio realizado sobre un pedido previamente enviado. Atributos
  relevantes: pedido afectado, tipo de cambio (añadir, retirar, ajustar cantidad o corregir) y
  momento del cambio.
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

> Nota: la numeración conserva el hueco de SC-004 para mantener estables los identificadores
> usados en planes, contratos y quickstarts.

## Assumptions

- El pedido que se edita ya existe y fue enviado previamente con al menos una partida (historia
  01); la toma inicial del pedido no forma parte de esta especificación.
- La mesa a la que pertenece el pedido ya se abrió previamente; abrir mesas y tomar pedidos es
  objeto de otra historia.
- El pedido mantiene su vínculo con la mesa aunque se modifiquen sus platos.
- Las señales visuales o sonoras al camarero sobre el estado de los platos (historia 05) y el
  flujo de cocina (historias 03 y 04) son objeto de otras historias y no forman parte de esta
  especificación.
- Métrica de negocio posterior al lanzamiento (no forma parte de los criterios de éxito verificables
  en la aplicación): el 95% de los camareros completará una edición de pedido al primer intento, sin
  ayuda.
