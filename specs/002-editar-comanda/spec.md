# Feature Specification: Editar una comanda enviada

**Feature Branch**: `002-editar-comanda`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: ¿Cómo llega el cambio a cocina tras editar una comanda ya enviada? → A: El camarero debe pulsar explícitamente una acción de "enviar cambios" para que cocina reciba la modificación; no se envía sola al guardar.
- Q: ¿Cómo debe tratarse un plato retirado de una comanda ya enviada que cocina ya puede estar preparando? → A: El plato se retira del pedido vigente y deja de aparecer en la comanda; el cambio se comunica a cocina al enviar cambios.
- Q: ¿Qué camarero puede reabrir y editar una comanda ya enviada? → A: Cualquier camarero identificado puede reabrir y editar la comanda enviada de cualquier mesa.
- Q: Si dos camareros editan a la vez la misma comanda ya enviada, ¿qué debe hacer el sistema? → A: La comanda se bloquea mientras un camarero la edita; otro camarero no puede abrirla hasta que el primero termine.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Editar una comanda ya enviada (Priority: P1)

En pleno servicio, después de haber enviado el pedido, un cliente cambia de opinión: pide que se
retire un ingrediente, añade un plato a última hora o decide que ya no quiere algo. El camarero
reabre la comanda que ya había sido enviada y la modifica sobre la marcha, sin tener que crear una
comanda nueva que duplique el pedido. Los cambios se aplican sobre la misma comanda y quedan
asociados a esa mesa. Como el pedido ya había llegado a cocina, el cambio queda marcado como una
modificación de la comanda original, de forma que se distingue de un pedido nuevo y no se confunde
con el anterior.

**Why this priority**: los cambios de última hora son constantes en sala; sin poder corregir una
comanda ya enviada, el camarero tendría que duplicar pedidos y cocina recibiría información
errónea o contradictoria.

**Independent Test**: puede probarse de principio a fin enviando una comanda, reabriéndola,
añadiendo y retirando platos y ajustando cantidades o indicaciones, y comprobando que los cambios
quedan sobre la misma comanda, marcada como modificada y vinculada a la misma mesa.

**Acceptance Scenarios**:

1. **Dado** una comanda ya enviada de una mesa, **cuando** el camarero la reabre, **entonces**
   la comanda admite de nuevo modificaciones.
2. **Dado** una comanda ya enviada reabierta para edición, **cuando** el camarero añade un plato
   nuevo, **entonces** el plato se incorpora a la comanda existente.
3. **Dado** una comanda ya enviada reabierta para edición, **cuando** el camarero retira un plato,
   **entonces** el plato desaparece de la comanda existente.
4. **Dado** una comanda ya enviada reabierta para edición, **cuando** el camarero ajusta la
   cantidad de un plato o corrige una indicación, **entonces** la comanda refleja el cambio.
5. **Dado** una comanda que ha sido editada, **cuando** el camarero la consulta, **entonces** la
   comanda figura marcada como modificada y distinta de un pedido nuevo.
6. **Dado** una comanda ya enviada que se ha editado, **cuando** el camarero la consulta,
   **entonces** sigue siendo una única comanda vinculada a la misma mesa.
7. **Dado** una comanda ya editada cuyos cambios aún no se han comunicado, **cuando** el camarero
   ejecuta la acción de enviar cambios, **entonces** cocina recibe la modificación marcada como
   tal.

---

### Edge Cases

- ¿Qué ocurre si el camarero reabre una comanda enviada y no realiza ningún cambio? La comanda
  debe conservar su estado sin quedar marcada como modificada innecesariamente.
- ¿Qué ocurre si el camarero retira todos los platos de una comanda ya enviada? El sistema debe
  impedir dejar la comanda sin ningún plato o exigir una acción explícita (por ejemplo, cancelar
  la comanda) en lugar de guardarla vacía.
- ¿Qué ocurre si el camarero modifica la comanda mientras cocina ya está preparando el pedido?
  La comanda debe seguir reflejando su estado actualizado y la modificación debe quedar marcada
  como tal.
- ¿Qué ocurre si la conexión se interrumpe al guardar una edición? El sistema debe evitar perder
  el cambio o avisar de que la edición no se ha podido aplicar.
- ¿Qué ocurre si el camarero intenta editar una comanda que ya no está enviada (por ejemplo, ya
  cerrada)? El sistema debe impedir la edición y avisar de que la comanda no admite cambios.
- ¿Qué ocurre si un camarero intenta editar una comanda que otro camarero tiene abierta? El
  sistema debe impedir el acceso simultáneo e indicar que la comanda está siendo editada.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: El sistema DEBE permitir a cualquier camarero identificado reabrir para edición la
  comanda ya enviada de cualquier mesa.
- **FR-002**: El sistema DEBE permitir añadir platos nuevos a una comanda ya enviada.
- **FR-003**: El sistema DEBE permitir retirar platos de una comanda ya enviada, quedando el plato
  retirado fuera del pedido vigente y dejando de aparecer en la comanda.
- **FR-004**: El sistema DEBE permitir modificar la cantidad de un plato de una comanda ya
  enviada.
- **FR-005**: El sistema DEBE permitir corregir las indicaciones de un plato de una comanda ya
  enviada.
- **FR-006**: El sistema DEBE aplicar los cambios sobre la comanda original, sin crear una
  comanda nueva ni duplicar el pedido.
- **FR-007**: El sistema DEBE mantener la comanda editada vinculada a la misma mesa que tenía.
- **FR-008**: El sistema DEBE conservar la identidad de la comanda tras la edición (sigue siendo
  la misma comanda, actualizada).
- **FR-009**: El sistema DEBE marcar la comanda como modificada cuando se edita tras haber sido
  enviada, de forma que se distinga de un pedido nuevo.
- **FR-010**: El sistema DEBE reflejar siempre el estado actualizado de la comanda tras la
  edición.
- **FR-011**: El sistema DEBE impedir dejar una comanda ya enviada sin ningún plato como
  resultado de una edición.
- **FR-012**: El sistema DEBE impedir editar una comanda que no admite cambios (por ejemplo, ya
  cerrada).
- **FR-013**: El sistema DEBE registrar que la comanda ha sido modificada, de manera que quede
  trazabilidad del cambio frente al pedido original.
- **FR-014**: El sistema DEBE requerir que el camarero ejecute explícitamente una acción de enviar
  los cambios para que cocina reciba la modificación; la edición no se comunica sola al guardar.
- **FR-015**: El sistema DEBE bloquear la comanda mientras un camarero la está editando, de modo
  que otro camarero no pueda editarla simultáneamente hasta que el primero termine.

### Key Entities _(include if feature involves data)_

- **Comanda**: pedido tomado para una mesa. Atributos relevantes: mesa asociada, estado (en curso,
  enviada o cerrada), platos que la componen y marca de modificada.
- **Línea de comanda**: cada plato dentro de una comanda. Atributos relevantes: plato, cantidad e
  indicaciones.
- **Modificación de comanda**: cambio realizado sobre una comanda previamente enviada. Atributos
  relevantes: comanda afectada, tipo de cambio (añadir, retirar, ajustar cantidad o corregir) y
  momento del cambio.
- **Mesa**: puesto del restaurante al que queda vinculada la comanda. Atributos relevantes:
  identificación de la mesa y estado.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Un camarero puede reabrir una comanda ya enviada, añadir o retirar un plato y
  confirmar el cambio en menos de 1 minuto.
- **SC-002**: El 100% de las ediciones se aplican sobre la comanda original, generando 0 comandas
  nuevas o duplicadas.
- **SC-003**: El 100% de las comandas editadas quedan marcadas como modificadas, de forma que
  nunca se confunden con un pedido nuevo.
- **SC-004**: El 95% de los camareros completa una edición de comanda al primer intento, sin
  ayuda.
- **SC-005**: Ninguna edición deja una comanda enviada sin platos (0 comandas vacías tras
  edición).
- **SC-006**: El 100% de las modificaciones llegan a cocina solo después de que el camarero haya
  ejecutado la acción de enviar cambios (0 envíos automáticos al guardar).

## Assumptions

- La comanda que se edita ya existe y fue enviada previamente con al menos una partida (historia
  01); la toma inicial de la comanda no forma parte de esta especificación.
- La mesa a la que pertenece la comanda ya se abrió previamente; abrir mesas y tomar comandas es
  objeto de otra historia.
- La comanda mantiene su vínculo con la mesa aunque se modifiquen sus platos.
- Las señales visuales o sonoras al camarero sobre el estado de los platos (historia 05) y el
  flujo de cocina (historias 03 y 04) son objeto de otras historias y no forman parte de esta
  especificación.
