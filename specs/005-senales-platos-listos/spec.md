# Feature Specification: Señales de platos listos por mesa

**Feature Branch**: `feature/005-senales-platos-listos`

**Created**: 2026-10-13

**Status**: Draft

## Clarifications

### Session 2026-10-13

- Q: ¿Puede un plato ya marcado como "listo" volver a "pendiente" si se corrige (por ejemplo, un error o un plato devuelto), y actualizarse en la pantalla del camarero? → A: Sí, reversible: un plato puede pasar de "listo" a "pendiente" y la vista del camarero y la completitud/aviso de la mesa se recalculan automáticamente.
- Q: ¿Qué debe hacer la pantalla del camarero mientras el dispositivo no tiene conexión con la red del restaurante? → A: Requiere conexión: al perderla muestra un indicador claro de "sin conexión" y marca el estado mostrado como no actualizado, resincronizándose automáticamente al recuperarla.
- Q: ¿Incluye esta historia que el camarero marque un plato o la mesa como "servido", o su papel termina en descartar el aviso? → A: Fuera de alcance: la única acción del camarero aquí es descartar el aviso; marcar platos o mesas como "servido" pertenece a otra historia.
- Q: ¿Cómo debe comportarse el aviso de mesa completa para que el camarero lo note a distancia: un único aviso o algo que se repita hasta descartarlo? → A: Aviso único (visual y, si está activada, sonoro) al completarse la mesa, manteniendo después una señal visual destacada y persistente hasta que el camarero lo descarte; no se repite por sí solo.
- Q: ¿Qué debe mostrar la pantalla del camarero cuando no tiene mesas abiertas o mientras la lista de mesas se está cargando? → A: Un estado vacío claro (por ejemplo, "No tienes mesas abiertas") y, mientras los datos están llegando, un indicador de carga.
- Q: ¿La aplicación debe funcionar sin conexión o exige estar conectada a la red del restaurante? → A: Exige conexión: al perderse muestra un indicador de "sin conexión", no permite confirmar ni modificar y conserva lo escrito en pantalla hasta recuperarla.
- Q: ¿Cada mesa queda vinculada a un camarero concreto o cualquier camarero puede ver y atender cualquier mesa? → A: Todas las mesas son compartidas: cualquier camarero ve, atiende y recibe los avisos de cualquier mesa.

### Session 2026-10-20

- Q: Cuando un camarero descarta el aviso de una mesa completa, ¿deja de mostrarse solo en su dispositivo o para todos los camareros? (FR-009, FR-010) → A: Para todos los camareros: el descarte es global y el aviso deja de mostrarse en todas las pantallas.
- Q: ¿Debe la historia 005 incluir el propio mecanismo para marcar y desmarcar un plato como listo, o se apoya en que lo aporte la historia 004? (FR-016) → A: La 005 incluye el mecanismo mínimo de marcado y desmarcado de un plato como listo, sin la pantalla de cocina ni el aviso temporal «Pedido completado», que son alcance de la historia 004.
- Q: ¿Qué platos de una mesa debe mostrar y contar la vista del camarero para considerarla "completa": solo los de la comanda ya enviada a cocina, o también los que aún se están tomando y todavía no se han enviado? (FR-001, FR-005) → A: Solo los platos de la comanda ya enviada a cocina; los platos aún sin enviar no cuentan para la completitud ni generan aviso.
- Q: ¿Cómo debe comportarse la señal sonora del aviso: activada por defecto con control para silenciarla, activada por defecto sin control propio, silenciada por defecto, o sin sonido? (FR-006) → A: Activada por defecto y con un control visible en la pantalla de sala para silenciarla y reactivarla.
- Q: Cuando el camarero edita una comanda ya enviada a cocina (añade, cambia o retira un plato) después de que la mesa estuviera completa, ¿qué debe pasar con los platos ya marcados como listos y con el aviso de esa mesa? (FR-013, FR-005) → A: Se recalcula la completitud tras la edición: los platos ya listos que no se tocan siguen listos; si entra un plato nuevo pendiente, la mesa deja de estar completa y el aviso se retira; al marcarlo listo, se genera un aviso nuevo.
- Q: ¿Qué debe considerarse exactamente una "mesa abierta" que aparece en la vista del camarero? (FR-001, FR-011) → A: Una mesa con una comanda en curso o ya enviada a cocina queda abierta mientras no se haya cerrado su cuenta.
- Q: Cuando se cierra la cuenta de una mesa que tenía un aviso de mesa completa activo (sin descartar), ¿qué debe pasar con ese aviso? (FR-010, FR-009) → A: El aviso se retira (deja de estar activo) y desaparece de todas las pantallas al cerrarse la cuenta de esa mesa.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Estado de los platos de cada mesa en tiempo real (Priority: P1)

Mientras se mueve por la sala durante el servicio, el camarero consulta en su
dispositivo las mesas abiertas del restaurante. Para cada mesa ve la relación de sus
platos junto con el estado de cada uno, diferenciando de un simple vistazo los
platos ya listos de los que siguen pendientes. Así sabe en todo momento qué puede
servir y qué no, sin tener que acercarse a la ventanilla de cocina ni preguntar
en voz alta.

**Why this priority**: Es la base de la historia: sin una vista actualizada del
estado de los platos, el camarero no puede saber qué servir. Por sí sola ya aporta
valor (deja de depender de la ventanilla) y es completamente probable sin el resto
de señales.

**Independent Test**: Puede probarse abriendo una mesa con platos en distinto estado
y comprobando que el camarero ve el estado de cada plato y que éste cambia solo al
marcarse un plato como listo en cocina.

**Acceptance Scenarios**:

1. **Given** un camarero con una o varias mesas abiertas, **When** consulta sus mesas, **Then** ve cada mesa con la relación de sus platos y el estado de cada uno.
2. **Given** una mesa con platos pendientes a la vista, **When** cocina marca uno de esos platos como listo, **Then** el estado de ese plato cambia a "listo" en la pantalla del camarero sin que éste tenga que refrescar ni volver a abrir la mesa.
3. **Given** una mesa con platos listos y pendientes a la vez, **When** el camarero la observa, **Then** distingue claramente qué platos están listos y cuáles pendientes.

---

### User Story 2 - Aviso de mesa completa (Priority: P2)

Cuando todos los platos de una mesa están listos, el sistema avisa al camarero con
una señal de atención visual y/o sonora propia de esa mesa, que identifica cuál es
la mesa cuyo pedido está completo, aunque el camarero se encuentre en otra parte de
la sala.

**Why this priority**: Aporta el aviso proactivo que evita que la comida espere en la
ventanilla. Depende de que el estado de los platos ya se refleje (historia 1), pero es
una rebanada de valor propia y comprobable por separado.

**Independent Test**: Puede probarse completando todos los platos de una mesa y
comprobando que aparece una señal asociada a esa mesa, perceptible desde lejos.

**Acceptance Scenarios**:

1. **Given** una mesa cuyos platos estaban pendientes, **When** se marca como listo el último plato que faltaba, **Then** el sistema emite una señal de aviso visual y/o sonora asociada a esa mesa.
2. **Given** un aviso de mesa completa activo, **When** el camarero se encuentra lejos de la pantalla, **Then** la señal sigue siendo perceptible y se distingue del resto de información.
3. **Given** varias mesas completas a la vez, **When** se generan sus avisos, **Then** cada aviso identifica la mesa a la que corresponde.

---

### User Story 3 - Descartar el aviso de una mesa atendida (Priority: P3)

Una vez el camarero ha atendido una mesa, descarta su aviso para que deje de
mostrarse y no entorpezca el resto del servicio.

**Why this priority**: Mejora el confort y evita avisos redundantes; el aviso ya aporta
valor sin descartarlo, por lo que es la rebanada de menor prioridad.

**Independent Test**: Puede probarse generando un aviso, descartándolo y comprobando
que deja de mostrarse.

**Acceptance Scenarios**:

1. **Given** un aviso de mesa completa activo, **When** el camarero lo descarta, **Then** el aviso deja de mostrarse.
2. **Given** un aviso ya descartado, **When** transcurre el servicio sin nuevos platos listos en esa mesa, **Then** el aviso no vuelve a aparecer.
3. **Given** dos camareros con el mismo aviso visible en sus dispositivos, **When** uno de ellos lo descarta, **Then** el aviso desaparece en las pantallas de ambos.

---

### Edge Cases

- ¿Qué ocurre cuando se completan varias mesas al mismo tiempo? Deben mostrarse avisos independientes que identifiquen cada mesa.
- ¿Cómo se comporta el aviso si, tras descartarlo, vuelve a haber un plato pendiente que luego se marca como listo? Debe poder generarse de nuevo.
- ¿Qué ocurre si el dispositivo tiene el sonido silenciado o desactivado? La señal visual debe seguir siendo suficiente.
- ¿Qué ocurre si el dispositivo pierde la conexión momentáneamente? La vista debe mostrar un indicador de "sin conexión" y marcar la información como no actualizada; al recuperarla, el estado de los platos y los avisos deben volver a estar al día.
- ¿Qué ocurre si varios camareros tienen el mismo aviso visible y uno lo descarta? El aviso se descarta para todos y desaparece de todas las pantallas.
- ¿Qué ocurre con una mesa cuyo pedido se compone de un único plato? Se trata igual que cualquier otra: al estar listo, la mesa se considera completa.
- ¿Qué ocurre si un aviso permanece sin atender mucho tiempo? No vuelve a sonar ni se repite, pero su señal visual sigue mostrándose y perceptible sin desaparecer por sí solo.
- ¿Qué ocurre si un plato vuelve a "pendiente" cuando la mesa ya estaba marcada como completa? El aviso de mesa completa debe retirarse y la mesa deja de considerarse completa hasta que ese plato vuelva a estar listo.
- ¿Qué muestra la vista cuando no hay ninguna mesa abierta o mientras la información se está cargando? Un mensaje claro de "No hay mesas abiertas" en el primer caso y un indicador de carga en el segundo, en lugar de una pantalla en blanco.
- ¿Qué ocurre con una mesa cuya comanda todavía no se ha enviado a cocina? Aparece como mesa abierta, pero sin platos que cocina pueda marcar; no se considera completa ni genera aviso hasta que se envíe.
- ¿Qué ocurre si se edita una comanda ya enviada (se añade, cambia o retira un plato) cuando la mesa ya estaba completa? Los platos ya listos que no se toquen siguen listos; si entra un plato pendiente, el aviso de mesa completa se retira y la mesa deja de considerarse completa hasta que ese plato vuelva a estar listo.
- ¿Qué ocurre si se cierra la cuenta de una mesa con un aviso de mesa completa activo? El aviso se retira y deja de mostrarse en todas las pantallas, junto con la desaparición de la mesa de la vista.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST mostrar al camarero todas las mesas abiertas del restaurante con la relación de los platos de la comanda **ya enviada a cocina**; los platos todavía sin enviar no forman parte de esta vista. Una mesa está **abierta** mientras tenga una comanda en curso o ya enviada a cocina y no se haya cerrado su cuenta.
- **FR-002**: El sistema MUST mostrar, para cada plato, si está pendiente o listo.
- **FR-003**: El sistema MUST distinguir visualmente los platos listos de los pendientes de forma inequívoca.
- **FR-004**: El estado de cada plato MUST actualizarse automáticamente en la vista del camarero, sin que éste tenga que refrescar ni volver a abrir la mesa.
- **FR-005**: Cuando todos los platos enviados a cocina de una mesa estén listos, el sistema MUST emitir un aviso asociado a esa mesa.
- **FR-006**: El aviso MUST incluir una señal visual y una señal sonora. La señal sonora MUST estar activada por defecto y MUST poder silenciarse y reactivarse desde la propia pantalla de sala, sin perder por ello la señal visual. La señal MUST emitirse una vez al completarse la mesa (una sola vez por aviso) y el aviso MUST mantener después una señal visual destacada y persistente hasta que el camarero lo descarte, sin repetirse por sí solo.
- **FR-007**: El aviso MUST identificar inequívocamente la mesa a la que corresponde.
- **FR-008**: El aviso MUST ser perceptible desde 5 metros de distancia y distinguirse del resto de información de la pantalla.
- **FR-009**: El camarero MUST poder descartar el aviso de una mesa una vez atendida; el
  descarte MUST aplicarse a todos los camareros y pantallas del restaurante.
- **FR-010**: Un aviso descartado MUST dejar de mostrarse en todas las pantallas
  mientras no se produzca un nuevo plato listo en esa mesa. Al cerrarse la cuenta de una
  mesa con un aviso activo, el sistema MUST retirar ese aviso y dejar de mostrarlo en todas
  las pantallas (una mesa cerrada ya no aparece en la vista).
- **FR-011**: El sistema MUST mostrar a cada camarero todas las mesas abiertas del restaurante, sin restringirlas a las que tenga asignadas.
- **FR-012**: Los cambios de estado realizados en cocina MUST reflejarse en la vista del camarero sin intervención manual de éste.
- **FR-013**: Un plato MUST poder volver del estado "listo" al estado "pendiente" si se corrige (por ejemplo, un error o un plato devuelto); al hacerlo, el sistema MUST recalcular automáticamente la completitud de la mesa y su aviso. La edición de una comanda ya enviada a cocina (añadir, cambiar o retirar un plato) MUST recalcular igualmente la completitud: los platos ya listos que no se toquen mantienen su estado; si con la edición entra un plato pendiente, la mesa deja de estar completa y su aviso se retira, y al marcarse ese plato como listo se genera un aviso nuevo.
- **FR-014**: La vista del camarero MUST requerir conexión con la red del restaurante; al perderse, MUST mostrar un indicador claro de "sin conexión" y marcar la información como no actualizada, y al recuperarla MUST resincronizar automáticamente el estado de los platos y los avisos.
- **FR-015**: Cuando no haya ninguna mesa abierta, la vista MUST mostrar un estado vacío claro (por ejemplo, "No hay mesas abiertas"); mientras la información esté cargando, MUST mostrar un indicador de carga en lugar de una pantalla en blanco.
- **FR-016**: La historia MUST incluir el mecanismo mínimo para marcar y desmarcar un plato como listo (responsabilidad de cocina), de forma que el cambio de estado que alimenta la vista del camarero pueda producirse y probarse de extremo a extremo; la pantalla de cocina y su aviso temporal «Pedido completado» pertenecen a la historia 004 y quedan fuera de esta historia.

### Key Entities *(include if feature involves data)*

- **Mesa**: mesa de la sala que el camarero atiende; agrupa un pedido y permanece abierta durante el servicio.
- **Plato**: cada una de las elaboraciones de un pedido, asociada a una mesa y a una partida (entrantes, principales, postres).
- **Estado del plato**: situación de un plato, pendiente o listo; es reversible y cambia cuando cocina lo marca o lo corrige.
- **Aviso de mesa**: señal de atención asociada a una mesa cuyo pedido está completo; tiene un estado activo o descartado.
- **Camarero**: persona que atiende las mesas y recibe los estados y avisos en su dispositivo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El camarero identifica qué platos de una mesa están listos en menos de 2 segundos desde que mira la pantalla.
- **SC-002**: Un plato marcado como listo en cocina se refleja en la pantalla del camarero en 5 segundos o menos, sin que éste haga nada.
- **SC-003**: El 100 % de las mesas cuyos platos se completan generan un aviso asociado a esa mesa.
- **SC-004**: El 100 % de los avisos permite identificar la mesa desde 5 metros de distancia en menos de 3 segundos, con la señal visual visible sin sonido.
- **SC-005**: El camarero descarta el aviso de una mesa atendida con una sola acción y en menos de 2 segundos.
- **SC-006**: Tras descartar un aviso, éste no vuelve a repetirse mientras no se marque un nuevo plato como listo en esa mesa.
- **SC-008**: Tras recuperar la conexión, la vista del camarero vuelve a estar al día (estados de platos y avisos) en 10 segundos o menos.
- **SC-009**: El 100 % de los descartes de aviso se refleja en las pantallas de todos los camareros en 5 segundos o menos.

> Nota: la numeración conserva el hueco de SC-007 para mantener estables los identificadores
> usados en planes, contratos y quickstarts.

## Assumptions

- El camarero lleva consigo durante el servicio un dispositivo con pantalla (y sonido) que permanece encendido y conectado a la red del restaurante.
- El marcado y desmarcado de platos como listos es responsabilidad de cocina. Además del estado que consume, esta historia incluye el mecanismo mínimo para producir ese cambio (marcar y desmarcar un plato), sin la pantalla de cocina ni el aviso temporal de la historia 004, de modo que el ciclo completo pueda probarse de extremo a extremo.
- Marcar platos o mesas como "servido" y cualquier cierre o cobro de cuenta quedan fuera del alcance de esta historia; la única acción del camarero aquí es descartar el aviso de una mesa.
- Todos los camareros comparten las mesas: cada camarero ve y recibe los avisos de cualquier mesa abierta del restaurante, no solo de las suyas.
- La señal visual es siempre obligatoria; la señal sonora está activada por defecto y puede silenciarse y reactivarse desde la pantalla de sala sin perder el aviso, y en todo caso suena una sola vez por aviso.
- Los avisos no desaparecen solos: permanecen visibles hasta que el camarero los descarta, salvo que la mesa se cierre, en cuyo caso el aviso se retira con ella.
- Una mesa está abierta mientras tenga una comanda en curso o ya enviada a cocina y no se haya cerrado su cuenta; las mesas cerradas no se muestran en la vista de sala.
- El idioma de toda la información mostrada es español de España.
- La funcionalidad se ofrece en la versión 1 dentro del alcance ya definido, sin funciones adicionales no especificadas.
- Métrica de negocio posterior al lanzamiento (no forma parte de los criterios de éxito verificables
  en la aplicación): se reducirá el tiempo que la comida permanece esperando en la ventanilla al
  servirla el camarero en cuanto recibe el aviso.
