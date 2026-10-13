# Feature Specification: Dashboard de estadísticas del servicio

**Feature Branch**: `007-dashboard-estadisticas`

**Created**: 2026-10-13

**Status**: Draft

**Input**: User description: "genera el spec de historia de usuario 07-dashboard.md (ten en cuenta que es un trabajo en grupo de 4 personas donde cada uno realiza 2 HU, a mi me corresponden la 07 y 08 por ejemplo)"

## Clarifications

### Session 2026-10-13

- Q: ¿La comparación de resultados debe hacerse contra el turno/servicio anterior o contra el día natural anterior? → A: Contra el turno/servicio anterior registrado.
- Q: ¿La comparación con el turno anterior debe ofrecer solo el total o también los desgloses por camarero y por plato? → A: Comparar el total y también los desgloses por camarero y por plato.
- Q: ¿El dashboard debe mostrar datos parciales mientras el servicio está en curso o solo al terminar el servicio? → A: Solo los datos del servicio una vez terminado, sin vista parcial durante el turno.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visión global de las ventas del servicio (Priority: P1)

Una vez terminado el servicio, el encargado del turno consulta el dashboard y ve de forma
inmediata cuánto se ha vendido en total durante ese servicio. La cifra principal se muestra de
forma clara y a primer golpe de vista, de modo que el encargado puede comprobar el balance de
la jornada sin necesitar ningún cálculo adicional.

**Why this priority**: es la funcionalidad central de la historia; sin el total de ventas no existe
visión de conjunto y el resto de desgloses pierden contexto. Entrega valor de forma aislada.

**Independent Test**: se puede probar de forma independiente cerrando una cuenta en el
sistema y comprobando que el dashboard del encargado muestra el total vendido de ese
servicio.

**Acceptance Scenarios**:

1. **Given** que ha terminado un servicio con varias cuentas cerradas, **When** el encargado
   abre el dashboard, **Then** ve el importe total en euros de lo vendido durante ese servicio.
2. **Given** un servicio sin ninguna cuenta cerrada, **When** el encargado abre el dashboard,
   **Then** ve que el total de ventas es 0,00 €.

---

### User Story 2 - Desglose de las ventas por camarero y por plato (Priority: P1)

Además del total, el encargado puede desglosar las ventas para entender qué ha ocurrido en la
sala: cuánto ha facturado cada camarero y qué platos se han vendido más o menos. El desglose
por camarero permite valorar el volumen atendido por cada uno, y el desglose por plato deja ver
cuáles tienen más salida y cuáles se quedan rezagados. Ambos desgloses se consultan desde el
propio dashboard.

**Why this priority**: los desgloses son el valor analítico de la historia; sin ellos el encargado
solo vería un número global sin capacidad de entender el comportamiento de la sala. Se prioriza
igual que el total porque ambos se consultan en el mismo flujo.

**Independent Test**: se puede probar de forma independiente comprobando que tras cerrar
cuentas el dashboard muestra la cifra agrupada por cada camarero y por cada plato.

**Acceptance Scenarios**:

1. **Given** que han cerrado cuentas varios camareros del turno, **When** el encargado consulta
   las ventas por camarero, **Then** ve la cifra total de cada camarero de ese servicio.
2. **Given** que se han vendido platos del servicio, **When** el encargado consulta las ventas
   por plato, **Then** ve la cantidad y el importe de cada plato vendido.
3. **Given** que un camarero o un plato no ha tenido ninguna venta en el servicio, **When** se
   consultan los desgloses, **Then** ese camarero o plato aparece sin ventas (0,00 €) en lugar de
   omitirse sin explicación.

---

### User Story 3 - Comparación con turnos anteriores (Priority: P2)

Un dato aislado dice poco sin contexto. El encargado puede comparar los resultados del servicio
con los de turnos anteriores, de modo que vea con claridad si las ventas han subido, bajado o se
han mantenido respecto a servicios previos. Esta comparación le permite valorar el rendimiento
del servicio apoyándose en datos y no solo en impresiones.

**Why this priority**: aporta contexto sobre el total; útil pero no imprescindible para la primera
versión, por lo que se sitúa por detrás de la visión global y de los desgloses.

**Independent Test**: se puede probar de forma independiente comprobando que el dashboard
muestra la diferencia porcentual del servicio actual frente al turno anterior seleccionado.

**Acceptance Scenarios**:

1. **Given** que existe al menos un turno anterior con ventas registradas, **When** el encargado
   consulta la comparación, **Then** ve la diferencia del total respecto al turno anterior.
2. **Given** que las ventas del servicio actual han subido respecto al turno anterior, **When** se
   muestra la comparación, **Then** se indica de forma clara que las ventas han subido.
3. **Given** que las ventas han bajado o se han mantenido, **When** se muestra la comparación,
   **Then** se indica de forma clara que han bajado o se han mantenido, respectivamente.
4. **Given** que no existe un turno anterior con el que comparar, **When** el encargado consulta
   la comparación, **Then** se muestra un mensaje indicando que no hay datos anteriores.
5. **Given** que existen ventas del turno anterior tanto por camarero como por plato, **When** el
   encargado consulta la comparación, **Then** ve la diferencia del turno actual frente al anterior
   también desglosada por camarero y por plato.

---

### Edge Cases

- Servicio sin ninguna venta: el total se muestra como 0,00 € y las comparaciones reflejan una
  bajada o un estado sin variación respecto a turnos anteriores.
- No existen turnos anteriores registrados: la sección de comparación muestra un aviso en lugar
  de un error o de datos vacíos sin explicación.
- Un camarero o un plato sin ventas en el servicio: aparece con 0,00 € en los desgloses.
- El turno anterior comparado no tiene ventas o tiene ventas parciales: la comparación se
  muestra igualmente con la diferencia real frente a ese turno.
- Dos servicios con idénticas ventas: la comparación se indica como "sin variación".
- El encargado consulta el dashboard antes de terminar el servicio en curso: se muestra el
  servicio anterior completado; el servicio en curso no aparece hasta su cierre.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST ofrecer al encargado un dashboard con los datos del servicio una
  vez este ha terminado; durante el servicio en curso no se muestran datos parciales (aclarado
  en la sesión de clarificación).
- **FR-002**: El sistema MUST mostrar el importe total en euros vendido durante el servicio.
- **FR-003**: El sistema MUST desglosar las ventas por camarero, mostrando el importe de cada
  camarero.
- **FR-004**: El sistema MUST desglosar las ventas por plato, mostrando la cantidad y el importe
  de cada plato.
- **FR-005**: El sistema MUST comparar el total del servicio con el de, al menos, el turno
  anterior.
- **FR-010**: El sistema MUST ofrecer la comparación con el turno anterior también desglosada
  por camarero y por plato (aclarado en la sesión de clarificación).
- **FR-006**: El sistema MUST indicar de forma inequívoca si la comparación refleja una subida,
  una bajada o una situación sin variación.
- **FR-007**: El sistema MUST mostrar un aviso cuando no existan turnos anteriores con los que
  comparar.
- **FR-008**: El sistema MUST reflejar en el dashboard exactamente las ventas registradas por las
  cuentas cerradas del servicio, sin desviaciones.
- **FR-009**: El dashboard y sus datos siguen el formato de moneda en euros y las convenciones
  españolas de número y fecha.

### Key Entities *(include if feature involves data)*

- **Servicio/Turno**: periodo de atención (una jornada o turno) con su fecha, total vendido y la
  referencia al turno anterior para la comparación.
- **Venta**: importe registrado por cada cuenta cerrada, asociada a un camarero y compuesta por
  platos con cantidades y precios.
- **Camarero**: perfil que cierra cuentas y del que se agregan las ventas en el desglose.
- **Plato**: elemento de la carta vendido, con su precio, del que se agrega cantidad e importe en
  el desglose.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El encargado puede ver el total vendido del servicio en la pantalla principal del
  dashboard, sin necesidad de realizar más de una acción de navegación.
- **SC-002**: El desglose por camarero y por plato está disponible desde el dashboard y su
  consulta no requiere salir de la vista de estadísticas.
- **SC-003**: La comparación con el turno anterior indica de forma visual y textual clara la
  subida, bajada o situación sin variación, tanto en el total como en los desgloses por camarero
  y por plato.
- **SC-004**: Las cifras del dashboard coinciden exactamente con la suma de las cuentas cerradas
  del servicio (verificable por una persona no técnica desde la interfaz, sin leer código).
- **SC-005**: La consulta del dashboard se realiza en menos de 3 segundos desde que el encargado
  la solicita, con los datos del servicio cargados.

## Assumptions

- El dashboard se consulta al terminar el servicio, tal y como indica el enunciado; no se
  muestran datos parciales del servicio en curso (aclarado en la sesión de clarificación).
- Los datos de ventas provienen de las cuentas cerradas en el sistema; el dashboard únicamente
  los agrega y presenta, sin generar ni modificar las ventas (dependencia con la funcionalidad de
  cierre de cuenta, fuera del alcance de esta spec).
- Solo el encargado del turno puede consultar el dashboard; el acceso se resuelve mediante los
  perfiles de usuario existentes en el sistema.
- La moneda es el euro y los formatos de número y fecha siguen la convención española de
  España (constitución del proyecto).
- La comparación se realiza contra el turno/servicio anterior registrado, no contra el día natural
  anterior (aclarado en la sesión de clarificación); ofrecer más histórico queda fuera de alcance
  para esta versión.