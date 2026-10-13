# Feature Specification: Cierre y división de cuenta

**Feature Branch**: `006-cierre-cuenta-division`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: Para dividir la cuenta "por lo consumido", ¿cómo sabe el sistema qué corresponde a cada comensal? → A: El camarero asigna cada plato consumido (o la porción correspondiente de su importe) a una parte al cerrar la cuenta; el pedido no registra el consumo por comensal.
- Q: Una vez dividida la cuenta, ¿se cierra la mesa con un único cobro del total o cada parte se marca como pagada por separado? → A: Cada parte se marca como pagada por separado y la mesa se cierra solo cuando todas las partes están pagadas.
- Q: ¿Debe el ticket final mostrar el desglose de impuestos (IVA) o basta con el total y las partes? → A: Los precios ya incluyen el IVA; el ticket muestra el total y las partes, sin desglose de impuestos (fuera de alcance en v1).
- Q: Si la cuenta cambia después de iniciar la división, ¿se actualiza sola, se reinicia o se bloquean los cambios? → A: La división se reinicia al modificar la cuenta y el camarero debe rehacerla sobre el total actualizado.
- Q: Cuando la cuenta no se puede repartir en partes exactamente iguales, ¿qué parte asume los céntimos sobrantes? → A: Los céntimos sobrantes se reparten de uno en uno entre las partes por orden, empezando por la primera, de modo que la suma siga coincidiendo con el total.
- Q: ¿La aplicación debe funcionar sin conexión o exige estar conectada a la red del restaurante? → A: Exige conexión: al perderse muestra un indicador de "sin conexión", no permite confirmar ni modificar y conserva lo escrito en pantalla hasta recuperarla.
- Q: Si el precio de un plato cambia entre el pedido y el cierre de la cuenta, ¿qué precio se usa? → A: El precio del momento de pedir: queda fijado al tomar el pedido y no cambia después.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cerrar la cuenta y calcular el total (Priority: P1)

Al terminar el servicio de una mesa, el camarero selecciona la opción de cerrar la
cuenta. El sistema reúne todo lo consumido por la mesa, calcula el importe total
aplicando el precio registrado en el momento de pedir cada plato y se lo muestra al camarero antes de
confirmar el cobro, de modo que pueda comprobar la cifra y cobrar correctamente.

**Why this priority**: Es la base del cierre: sin el cálculo y la visualización del
total no hay cuenta que cobrar. Por sí sola ya aporta valor (cobrar la mesa) y es
comprobable sin el resto de la historia.

**Independent Test**: Puede probarse abriendo una mesa con consumos, cerrando su cuenta
y comprobando que el total mostrado coincide con la suma de los platos con el precio
registrado en el momento de pedir cada uno.

**Acceptance Scenarios**:

1. **Given** una mesa con consumos registrados, **When** el camarero elige cerrar la cuenta, **Then** el sistema calcula y muestra el importe total a partir de lo consumido con el precio registrado en el momento de pedir cada plato.
2. **Given** una cuenta con su total calculado, **When** el camarero la revisa antes de confirmar, **Then** ve el total a cobrar y puede confirmar o cancelar el cierre.
3. **Given** una cuenta con su total calculado, **When** el camarero cancela el cierre antes de confirmar, **Then** la cuenta y la mesa quedan como estaban.

---

### User Story 2 - Dividir la cuenta entre comensales (Priority: P2)

Cuando los comensales quieren repartir el importe, el camarero divide la cuenta en
tantas partes como haga falta, ya sea en partes iguales o repartiendo cada parte según
lo consumido por cada comensal, quedando cada parte asociada a quien corresponde sin
que deje de cuadrar el total.

**Why this priority**: Aporta el reparto, que es el caso habitual cuando se cobra en
grupo. Depende del total ya calculado (historia 1), pero es una rebanada de valor
propia y comprobable por separado.

**Independent Test**: Puede probarse dividiendo una cuenta en varias partes (iguales y
por consumo) y comprobando que cada parte queda asociada a un comensal y que la suma
coincide con el total.

**Acceptance Scenarios**:

1. **Given** una cuenta con su total calculado, **When** el camarero la divide en varias partes iguales, **Then** el sistema reparte el importe y la suma de las partes coincide con el total.
2. **Given** una cuenta con su total calculado, **When** el camarero reparte el importe según lo consumido por cada comensal, **Then** cada parte queda asociada al comensal correspondiente y la suma sigue coincidiendo con el total.
3. **Given** una cuenta dividida en varias partes, **When** el camarero revisa la división, **Then** ve cada parte y su importe.

---

### User Story 3 - Ticket final y cierre de la mesa (Priority: P3)

Al formalizar el cierre, el sistema genera el ticket final con el total de la cuenta y
el desglose de cada parte y su importe. Una vez confirmado el cobro, la mesa queda
cerrada y deja de estar activa, sin admitir nuevas operaciones.

**Why this priority**: Cierra el ciclo (documento final y bloqueo de la mesa), pero el
valor principal (cobrar y repartir) ya se entrega sin él, por lo que es la rebanada de
menor prioridad.

**Independent Test**: Puede probarse confirmando el cobro de una cuenta dividida y
comprobando que el ticket refleja el total y cada parte, y que la mesa cerrada rechaza
nuevas operaciones.

**Acceptance Scenarios**:

1. **Given** una cuenta preparada para cerrar, **When** el camarero confirma el cobro, **Then** el sistema genera el ticket final con el total de la cuenta y el desglose de cada parte con su importe.
2. **Given** una mesa cerrada tras el cobro, **When** se intenta realizar una nueva operación sobre ella, **Then** el sistema la rechaza por estar cerrada.
3. **Given** una cuenta ya cerrada, **When** se intenta cerrarla de nuevo, **Then** el sistema lo impide.
4. **Given** una cuenta dividida con partes aún pendientes de pago, **When** se intenta cerrar la mesa, **Then** el sistema no la cierra hasta que todas las partes estén pagadas.

---

### Edge Cases

- ¿Qué ocurre cuando el total no se puede repartir en partes exactamente iguales (por ejemplo, 10 € entre 3)? Los céntimos sobrantes se reparten de uno en uno entre las partes por orden, empezando por la primera, de modo que la suma de las partes siga coincidiendo con el total.
- ¿Qué ocurre si un plato lo comparten varios comensales? Debe poder repartirse su importe entre las partes correspondientes sin perder la coincidencia con el total.
- ¿Qué ocurre si el camarero cancela el cierre antes de confirmar el cobro? La cuenta y la mesa deben quedar como estaban, sin cambios.
- ¿Qué ocurre con una mesa sin consumos? La cuenta debe mostrar un total de cero y no debe permitir un cierre sin importe.
- ¿Qué ocurre si no están pagadas todas las partes de una cuenta dividida? La mesa no se cierra hasta que todas las partes queden marcadas como pagadas.
- ¿Qué ocurre si se modifica la cuenta después de iniciar la división? La división se reinicia y el camarero debe rehacerla sobre el nuevo total.
- ¿Qué ocurre si un precio cambia entre el consumo y el cierre? Se aplica el precio registrado en el momento de pedir cada plato; el cambio de precio no altera las cuentas ya en curso.
- ¿Qué ocurre si se intenta cerrar una cuenta que ya está cerrada? El sistema debe impedirlo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El camarero MUST poder iniciar el cierre de la cuenta de una mesa.
- **FR-002**: El sistema MUST calcular el importe total de la cuenta a partir de lo consumido, aplicando el precio registrado en el momento de pedir cada plato.
- **FR-003**: El sistema MUST mostrar el importe total al camarero antes de confirmar el cobro.
- **FR-004**: El camarero MUST poder cancelar el cierre antes de confirmarlo, dejando la cuenta y la mesa sin cambios.
- **FR-005**: El camarero MUST poder dividir la cuenta en varias partes.
- **FR-006**: La división MUST poder hacerse en partes iguales.
- **FR-007**: La división MUST poder hacerse repartiendo el importe según lo consumido por cada comensal.
- **FR-008**: Cada parte de la división MUST quedar asociada al comensal al que corresponde.
- **FR-009**: La suma de las partes MUST coincidir siempre con el importe total de la cuenta.
- **FR-010**: El sistema MUST generar el ticket final con el total de la cuenta y el desglose de cada parte con su importe.
- **FR-011**: Al confirmar el cobro de la cuenta, o de todas sus partes cuando esté dividida, el sistema MUST cerrar la mesa y dejarla inactiva.
- **FR-012**: Una mesa cerrada MUST rechazar cualquier nueva operación.
- **FR-013**: El sistema MUST mostrar los importes en euros (€) con el formato español de números y fechas.
- **FR-014**: El sistema MUST impedir cerrar una cuenta que ya esté cerrada.
- **FR-015**: Al cerrar la cuenta, el camarero MUST poder asignar cada plato consumido (o una porción de su importe) a una de las partes de la división, ya que el pedido no registra el consumo por comensal.
- **FR-016**: Cuando la cuenta esté dividida, el camarero MUST poder marcar cada parte como pagada por separado; la mesa MUST cerrarse solo cuando todas las partes estén pagadas.
- **FR-017**: Si la cuenta se modifica después de iniciar una división, el sistema MUST reiniciar la división para que el camarero la rehaga sobre el total actualizado.
- **FR-018**: En una división en partes iguales que no sea exacta, el sistema MUST repartir los céntimos sobrantes de uno en uno entre las partes por orden, empezando por la primera, de modo que la suma siga coincidiendo con el total.

### Key Entities *(include if feature involves data)*

- **Mesa**: mesa que se cobra; agrupa el consumo y pasa a estar cerrada tras el cobro.
- **Cuenta**: importe total de lo consumido por una mesa y su estado (abierta o cerrada).
- **Consumo**: cada plato registrado en la mesa con el precio fijado en el momento de pedirlo, base del cálculo del total; puede asignarse a una parte de la división al cerrar la cuenta.
- **División de la cuenta**: conjunto de partes en que se reparte el importe; cada parte tiene un importe, una forma (partes iguales o por consumo) y los platos o porciones asignados.
- **Comensal**: persona a la que se asocia una parte de la cuenta.
- **Parte de la cuenta**: cada porción de la división, con su importe, el comensal asociado y su estado (pendiente de pago o pagada).
- **Ticket**: documento final con el total de la cuenta y el desglose de cada parte con su importe; los precios ya incluyen el IVA y no se desglosa impuesto alguno.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las cuentas cerradas muestran un total igual a la suma de los consumos con el precio registrado en el momento de pedir cada plato.
- **SC-002**: El camarero cierra la cuenta de una mesa en menos de 2 minutos.
- **SC-003**: En el 100 % de las cuentas divididas, la suma de las partes coincide exactamente con el total, incluso en los casos con redondeo.
- **SC-004**: El ticket final incluye el total y el desglose de cada parte con su importe en el 100 % de los cierres.
- **SC-005**: Una mesa cerrada rechaza el 100 % de las nuevas operaciones intentadas sobre ella.
- **SC-006**: El camarero completa la división de una cuenta entre varios comensales en menos de 3 minutos.
- **SC-007**: Una mesa cuya cuenta está dividida permanece abierta hasta que el 100 % de sus partes están marcadas como pagadas.

## Assumptions

- El pedido no registra qué comensal consume cada plato; la asignación de platos (o porciones) a las partes de la división se realiza al cerrar la cuenta.
- Los precios de los platos son los del momento de pedir cada plato y se muestran con IVA incluido; el desglose de impuestos queda fuera del alcance de esta historia.
- El cobro lo confirma el camarero (efectivo, tarjeta u otro medio); el sistema no se integra con terminales de pago.
- La división de la cuenta es opcional: por defecto la cuenta se cobra como un único pago; si se divide, cada parte se paga por separado y la mesa se cierra al completarse el pago de todas ellas.
- No se contemplan propinas, descuentos ni anulaciones parciales en esta historia.
- Una mesa cerrada no se reabre en la versión 1.
- Cómo se entrega el ticket (impresión o formato digital) queda fuera del alcance; esta historia se centra en su contenido.
- La interfaz y los importes están en español de España y en euros (€).
- La funcionalidad se ofrece en la versión 1 dentro del alcance ya definido, sin funciones adicionales no especificadas.
