# Feature Specification: Marcar platos como listos

**Feature Branch**: `004-marcar_listos`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: Cuando un pedido incluye varias unidades del mismo plato (por ejemplo, 3 raciones), ¿la marca de "listo" se aplica a toda la línea del plato de una vez o a cada unidad por separado? (FR-001, FR-004) → A: La marca se aplica a toda la línea del plato: todas sus unidades quedan listas a la vez.
- Q: Si el cocinero marca un plato como listo por error, ¿debe poder deshacer esa marca (volver a dejarlo pendiente) dentro de esta historia? (FR-009) → A: Sí, el cocinero puede desmarcar un plato y devolverlo a pendiente.
- Q: Cuando cocina marca un plato como listo, ¿qué pantallas de camarero deben reflejar ese cambio? (FR-008) → A: Todas las pantallas de los camareros que atienden la mesa del pedido.
- Q: ¿Debe el cocinero poder marcar como listos todos los platos de un pedido de una sola vez, además de plato a plato? (FR-001) → A: No; solo se marca plato a plato, como describe la historia.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Marcar un plato como listo desde la cocina (Priority: P1)

Mientras avanza el servicio, el cocinero prepara los platos de los pedidos pendientes de su partida. Cuando termina un plato, lo marca como listo directamente desde la pantalla de cocina, seleccionando el plato dentro de su pedido. Al marcarlo, ese plato deja de contarse como pendiente, mientras los demás platos del mismo pedido siguen pendientes hasta que también se completen. Así el propio cocinero comunica su avance sin avisar a nadie de viva voz.

**Why this priority**: Es el núcleo de la historia. Sin la acción de marcar un plato como listo, ni la cocina avanza ni sala recibe ninguna información; el resto de la historia depende de esta acción.

**Independent Test**: Con un pedido pendiente de la partida del cocinero, marcar uno de sus platos como listo y comprobar que ese plato queda marcado como listo y que los demás platos del mismo pedido siguen pendientes.

**Acceptance Scenarios**:

1. **Given** un pedido pendiente de la partida del cocinero, **When** el cocinero marca uno de sus platos como listo, **Then** ese plato queda registrado como listo.
2. **Given** un pedido con varios platos pendientes, **When** el cocinero marca uno de ellos como listo, **Then** ese plato deja de contarse como pendiente y los demás continúan pendientes.
3. **Given** un pedido al que ya se han marcado como listos todos sus platos, **When** el cocinero termina el último, **Then** el pedido deja de aparecer como pendiente en la pantalla de cocina.
4. **Given** un plato que no pertenece a la partida del cocinero o que ya no está pendiente, **When** el cocinero intenta marcarlo como listo, **Then** la acción no se permite y el estado no cambia.
5. **Given** un plato marcado como listo, **When** el cocinero deshace la marca, **Then** el plato vuelve a estar pendiente en la pantalla de cocina.

---

### User Story 2 - Reflejo inmediato en la pantalla del camarero (Priority: P2)

En cuanto el cocinero marca un plato como listo, la pantalla del camarero correspondiente refleja que ese plato ya está preparado y puede servirse, sin retrasos y sin que el camarero tenga que preguntar a cocina. Sala y cocina mantienen así una información coherente sobre el estado de cada plato durante todo el servicio.

**Why this priority**: Es la finalidad declarada de la historia (que sala lo sepa al momento). Aporta el valor que conecta cocina y sala, aunque sin la acción de marcado (P1) no existiría.

**Independent Test**: Con la pantalla del camarero abierta para una mesa con un plato pendiente, marcarlo como listo desde cocina y comprobar que la pantalla del camarero muestra el plato como listo sin necesidad de recargar.

**Acceptance Scenarios**:

1. **Given** un plato pendiente que el cocinero acaba de marcar como listo, **When** el camarero consulta su pantalla, **Then** el plato aparece como listo para servir.
2. **Given** la pantalla del camarero abierta, **When** cocina marca un plato como listo, **Then** el cambio se refleja sin que el camarero recargue ni actualice manualmente.
3. **Given** varios camareros que atienden la misma mesa, **When** cocina marca un plato de esa mesa como listo, **Then** todos ellos ven el plato como listo.

---

### User Story 3 - Registrar el momento de preparación (Priority: P3)

El sistema deja constancia del momento exacto en que cada plato se marcó como listo, de forma que queda registro del ritmo de preparación de la partida a lo largo del servicio. Volver a marcar un plato ya listo no cambia ese momento.

**Why this priority**: Aporta trazabilidad y sienta la base para métricas posteriores, pero la historia entrega su valor principal (cocina avanza y sala lo sabe) sin necesidad de explotar ese registro.

**Independent Test**: Marcar varios platos como listos en momentos distintos y comprobar que cada uno guarda el momento en que se marcó, sin variar aunque se intente volver a marcarlo.

**Acceptance Scenarios**:

1. **Given** un plato que se marca como listo, **When** la acción se completa, **Then** el sistema guarda el momento en que se marcó.
2. **Given** un plato ya marcado como listo, **When** se intenta marcar de nuevo, **Then** el momento registrado no cambia.
3. **Given** varios platos marcados como listos durante el servicio, **When** se consultan, **Then** cada uno conserva su propio momento de marcado.

---

### Edge Cases

- **Plato ya marcado como listo**: la acción no tiene efecto y no se altera el momento registrado previamente.
- **Plato de otra partida**: no puede marcarse; la marca solo aplica a la partida del cocinero.
- **Plato de un pedido que ya no está pendiente** (por ejemplo, retirado o cancelado desde sala): no puede marcarse.
- **Plato retirado de la comanda antes de marcarlo** (historia 02): deja de existir como pendiente y no puede marcarse.
- **Último plato de un pedido**: al marcarlo, el pedido deja de estar pendiente y desaparece de la lista de pendientes de cocina.
- **Un pedido con todos sus platos listos**: la pantalla del camarero refleja que todos los platos del pedido están listos.
- **Interrupción momentánea de la conexión al marcar**: la marca no debe perderse ni duplicarse; al restablecerse, el estado de cocina y de sala debe ser coherente.
- **Marcado simultáneo del mismo plato** desde dos pantallas de la misma partida: el resultado debe ser uno solo, sin duplicar el momento registrado.
- **Pedido con varias unidades del mismo plato**: la marca afecta a la línea completa del plato (todas sus unidades), no a unidades sueltas.
- **Deshacer una marca de listo**: el plato vuelve a contarse como pendiente y reaparece entre los platos por preparar del pedido; la pantalla del camarero deja de mostrarlo como listo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La pantalla de cocina MUST permitir al cocinero marcar un plato como listo seleccionándolo dentro de su pedido.
- **FR-002**: Un plato MUST poder marcarse como listo solo si pertenece a un pedido pendiente de la partida del cocinero.
- **FR-003**: La pantalla de cocina MUST NOT permitir marcar como listo un plato de otra partida ni un plato que ya no esté pendiente.
- **FR-004**: Al marcarse como listo, el plato MUST dejar de contarse como pendiente y MUST distinguirse visualmente de los que siguen pendientes.
- **FR-005**: Los demás platos del mismo pedido MUST permanecer como pendientes hasta que se marquen como listos.
- **FR-006**: Cuando todos los platos de un pedido estén marcados como listos, el pedido MUST dejar de aparecer como pendiente en la pantalla de cocina.
- **FR-007**: El sistema MUST registrar el momento en que cada plato se marca como listo.
- **FR-008**: La marca de "listo" MUST reflejarse en las pantallas de los camareros que atienden la mesa del pedido, sin que tengan que recargar ni actualizar manualmente.
- **FR-009**: Volver a marcar un plato ya listo MUST NOT alterar el momento registrado ni el estado.
- **FR-010**: Una marca de "listo" MUST NOT perderse ni duplicarse si la conexión se interrumpe en el momento de la acción.
- **FR-011**: Los estados reflejados en cocina y en sala MUST ser coherentes para un mismo plato en todo momento.
- **FR-012**: Todos los textos visibles de la acción y de los estados (pendiente, listo) MUST estar en español de España.
- **FR-013**: La marca de "listo" MUST aplicarse a la línea completa del plato, de modo que todas sus unidades queden listas a la vez.
- **FR-014**: El cocinero MUST poder deshacer la marca de un plato marcado como listo, devolviéndolo a pendiente.
- **FR-015**: Al deshacer la marca, el plato MUST dejar de conservar su condición de listo y MUST volver a contarse como pendiente en la pantalla de cocina y en la pantalla del camarero.
- **FR-016**: El marcado de platos como listos MUST realizarse plato a plato; la pantalla de cocina MUST NOT ofrecer una acción para marcar todos los platos de un pedido a la vez.

### Key Entities *(include if data involved)*

- **Cocinero**: persona que marca los platos como listos; actúa únicamente sobre los pedidos pendientes de la partida que tiene asignada.
- **Partida**: agrupación de la carta (entrantes, principales, postres) que determina sobre qué platos puede actuar cada cocinero.
- **Pedido de cocina**: porción de una comanda enviada desde sala que corresponde a una partida y a una mesa; está pendiente mientras alguno de sus platos no esté listo.
- **Plato de pedido (línea de pedido)**: plato de un pedido con su cantidad; tiene un estado reversible (pendiente o listo) y, mientras está marcado como listo, guarda el momento en que se marcó (que se descarta al deshacer la marca).
- **Mesa**: mesa de origen del pedido, que permite a cocina y sala referirse al mismo pedido.
- **Pantalla del camarero**: vista de sala que refleja el estado de cada plato; en esta historia sólo se garantiza que recibe y muestra la marca de "listo".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cocinero marca un plato como listo en 3 segundos o menos desde que lo tiene localizado en pantalla.
- **SC-002**: En el 100% de los casos, marcar un plato como listo solo cambia ese plato y deja los demás platos del pedido pendientes.
- **SC-003**: La pantalla del camarero muestra un plato como listo en 5 segundos o menos desde que cocina lo marca, sin recargar la pantalla.
- **SC-004**: El 100% de los platos marcados como listos guarda el momento en que se marcó, con una precisión de al menos un minuto.
- **SC-005**: Al marcar el último plato pendiente de un pedido, el pedido desaparece de la lista de pendientes de cocina en 5 segundos o menos.
- **SC-006**: Tras una interrupción momentánea de la conexión durante el marcado, el 100% de las marcas queda registrado una sola vez, sin pérdidas ni duplicados.
- **SC-007**: Un cocinero distingue de un vistazo, en el 100% de los pedidos, qué platos ya están listos y cuáles siguen pendientes.
- **SC-008**: Al deshacer la marca de un plato, este vuelve a aparecer como pendiente en la pantalla de cocina en 5 segundos o menos.

## Assumptions

- Un "plato" corresponde a la línea del pedido (plato y su cantidad); marcar un plato como listo marca todas las unidades de esa línea, no unidades sueltas.
- El estado de un plato es binario (pendiente o listo); no se contempla un estado intermedio de "en preparación".
- Un plato marcado como listo puede deshacerse por el propio cocinero, devolviéndolo a pendiente; no se contemplan deshacer marcas ya servidas ni realizadas por otros roles.
- El cocinero ya queda identificado con su partida al usar la pantalla de cocina (historia 03); esta historia no introduce un inicio de sesión propio.
- Los pedidos y sus platos provienen de las comandas confirmadas en sala (historias 01 y 02) y de la vista de pedidos pendientes de cocina (historia 03).
- Las señales visuales y/o auditivas dedicadas en la pantalla del camarero son objeto de la historia 05; aquí sólo se garantiza que la marca de "listo" se refleja en el estado que sala consulta.
- El cierre de cuenta (historia 06), el dashboard (historia 07) y la administración (historia 08) quedan fuera del alcance.
- Se asume conectividad de red del local durante el servicio; ante cortes momentáneos, la marca se conserva y se reconcilia al restablecerse.
