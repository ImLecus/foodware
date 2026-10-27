# Phase 0 — Research: Cierre y división de cuenta

Este documento resuelve las incógnitas del *Technical Context* y fija las decisiones de
diseño para la historia 006. Formato: Decisión / Rationale / Alternativas consideradas.

## 0. Contexto de proyecto (stack ya fijado)

**Decisión**: la historia 006 reutiliza las decisiones técnicas ya fijadas a nivel de proyecto
por el plan de la historia 005 (y aplicables a las historias 01–08): JavaScript (ES2022) sobre
Node.js 22 LTS, React 18 + Chakra UI en el frontend, ExpressJS 4 en el backend, SQLite
con `better-sqlite3` y migraciones SQL versionadas, Vitest + Supertest (backend) y Vitest + React Testing
Library (frontend), y arranque con Docker Compose. No se introducen decisiones nuevas de stack.

**Rationale**: la constitución fija React + Chakra UI y ExpressJS sobre Node; el resto son
decisiones de proyecto que 006 hereda para no fragmentar el repositorio. Mantener un único
stack cumple el Principio I (simplicidad) y el VII (desarrollo en equipo).

**Alternativas consideradas**: elegir un stack distinto para esta historia (descartado: rompe
la coherencia del proyecto y la constitución).

## 1. Cálculo del importe total (FR-002, FR-003, SC-001)

**Decisión**: el total de la cuenta es la suma de `cantidad × precio_unitario` de cada línea
de pedido de la mesa, usando el **precio fijado en el momento de pedir** (historia 01,
FR-019). El importe se calcula en céntimos enteros para evitar errores de coma flotante y se
muestra en euros (€) con formato español.

**Rationale**: el precio ya está fijado en la línea (historia 01), de modo que el cálculo es
una agregación directa y verificable; operar en céntimos garantiza que la suma de las partes
coincida exactamente con el total (FR-009, SC-003).

**Alternativas consideradas**: recalcular con el precio actual de la carta (descartado: lo
prohíbe la clarificación de la spec); usar números en coma flotante (descartado: introduce
descuadres de céntimos).

## 2. Modelo de la cuenta: derivada y persistida durante el cobro

**Decisión**: mientras la mesa está abierta y no hay división, la **cuenta abierta es un
modelo derivado** que se calcula desde los consumos (no se persiste). Al confirmar una
**división**, se persiste una fila de `cuentas` en estado `abierta` con su total base, sus
partes en estado `pendiente` y sus asignaciones; así el pago y la reversión de cada parte
sobreviven entre peticiones. En la misma transacción que completa el pago (última parte
pendiente o pago único) la cuenta pasa a `cerrada`, se guarda `cerrada_en` y la mesa vuelve a estar `libre` para una nueva comanda.

**Rationale**: el pago por partes y su reversión son operaciones separadas en el tiempo y
necesitan un estado persistido; sin él no se podría deshacer una marca ni saber cuántas partes
quedan. Persistir solo al confirmar la división evita "borradores" antes de que el camarero
empiece a cobrar (FR-004) y mantiene el Principio I: no se persiste lo que aún no hace falta.

**Alternativas consideradas**: persistir la cuenta al abrir la mesa (propiedad de otra
historia y complejidad innecesaria); mantener los pagos solo en pantalla (se perderían al
recargar y no permitirían la reversión entre peticiones); persistir la cuenta únicamente al
cerrarla (incompatible con el pago y la reversión parte a parte).

## 3. División en partes iguales y reparto de céntimos (FR-006, FR-018, SC-003)

**Decisión**: en partes iguales, cada parte recibe `base = total ÷ n` (división entera en
céntimos) y el resto `total − base × n` se reparte **de uno en uno entre las partes por orden,
empezando por la primera**; las primeras `resto` partes reciben un céntimo más. La suma de las
partes es siempre exactamente el total.

**Rationale**: cumple literalmente la clarificación de la spec y SC-003 (la suma coincide
incluso con redondeo); es determinista y reproducible, lo que la hace verificable por una
persona no técnica (Principio IV).

**Alternativas consideradas**: dar todo el resto a una sola parte o prorratear en coma
flotante (descartadas: descuadran o no son deterministas).

## 4. División por consumo y asignación de platos o porciones (FR-007, FR-015)

**Decisión**: en modo "por consumo", el camarero asigna cada consumo (o una **porción de su
importe**, para platos compartidos) a una parte. El importe de cada parte es la suma de sus
asignaciones; la suma de todas las asignaciones debe ser igual al total. Las asignaciones se
persisten en `cuentas_parte_consumos` con el importe asignado.

**Rationale**: el pedido no registra el consumo por comensal (clarificación), así que la
asignación se hace al confirmar la división; permitir porciones cubre el caso de un plato
compartido sin perder la coincidencia con el total (FR-009).

**Alternativas consideradas**: obligar a asignar cada consumo a una única parte (no cubre
platos compartidos); guardar solo el importe de cada parte sin detalle (impide comprobar que
todo lo consumido está asignado).

## 5. Detección de cambios y reinicio de la división (FR-017)

**Decisión**: la división se apoya en un **total base** (el total sobre el que se construyó).
Al confirmar la división y en cada marca o reversión de pago, el backend recalcula el total
actual y, si difiere del total base, rechaza la operación (`422`), descarta la división e
indica que la cuenta cambió; la pantalla vuelve a cargar la cuenta con el total actualizado y
el camarero rehace la división.

**Rationale**: cumple FR-017 sin bloquear el pedido y sin un canal de tiempo real propio; el
caso de edición concurrente es poco frecuente y se resuelve en cada operación de pago
(Principio I).

**Alternativas consideradas**: bloquear la cuenta mientras se divide (como la edición de
pedido de la historia 02: más complejidad y estados); suscribirse a eventos para reiniciar en
vivo (no exigido por la spec).

## 6. Pago por partes, reversión y cierre transaccional (FR-011, FR-014, FR-016, SC-005, SC-007, SC-009)

**Decisión**: el camarero marca cada parte como pagada por separado. Cada marca se valida y
persiste en su propia transacción. Al marcar la **última** parte pendiente, la misma
transacción comprueba que el total actual coincide con el total base, cierra la cuenta, libera
la mesa, emite el único ticket y publica `mesa-cerrada`. Una parte marcada por error puede volver
a `pendiente` mientras la cuenta siga abierta; la reversión limpia `pagada_en` y deja la cuenta
abierta. Cerrar una cuenta ya cerrada se rechaza (`409`), igual que revertir una parte con la
cuenta cerrada.

**Rationale**: cumple literalmente las clarificaciones del 2026-10-20 y SC-007/SC-009: la cuenta
solo se cierra con todas las partes pagadas y la reversión es posible únicamente antes del
cierre. La transacción evita cierres parciales, tickets duplicados o una cuenta cerrada con
partes pendientes.

**Alternativas consideradas**: una única operación de cierre con todas las partes ya pagadas
(contradice el pago y la reversión parte a parte); permitir revertir después del cierre
(contradice la clarificación y obligaría a reabrir la cuenta); persistir cada pago como un
borrador independiente (más estados y limpieza).

## 7. Notificación a la vista de sala (integración con la historia 005)

**Decisión**: al cerrar la cuenta, el backend emite el evento `mesa-cerrada` por el **hub SSE ya
existente** (historia 005), para que las pantallas de sala refresquen la mesa y la muestren como
libre. La
pantalla de cierre de 006 no se suscribe a tiempo real: carga la cuenta por HTTP y valida el
total base en cada operación de pago.

**Rationale**: mantiene coherentes sala y cierre sin introducir un canal de tiempo real nuevo
(Principio I) y sin duplicar infraestructura; la historia 006 no necesita refresco en vivo
propio.

**Alternativas consideradas**: que la historia 006 tuviera su propio canal en vivo (innecesario);
no notificar (la vista de sala mantendría la mesa ocupada hasta recargar).

## 8. Pruebas automatizadas y verificación

**Decisión**: backend con Vitest + Supertest (contrato de las rutas de cuenta, división y pago
por partes; cálculo del total; redondeo de céntimos en partes iguales; validación de la
división; pago y reversión de partes; emisión única del ticket; cierre transaccional; rechazo
de cuenta ya cerrada, de partes pendientes al cerrar, de bloqueo por platos pendientes, de
reutilización de mesa y de reversión con la cuenta cerrada) y
frontend con Vitest + React Testing Library (resumen del total, división en ambos modos, pago
y reversión de partes, ticket y estado de error). Los criterios de éxito se comprueban además
con los escenarios de `quickstart.md`.

**Rationale**: cumple la regla de "pruebas junto a la funcionalidad" de la constitución y hace
verificables los redondeos, el bloqueo por cocina y la reutilización de la mesa, que son los
puntos más propensos a fallar.

**Alternativas consideradas**: un único *runner* para todo (posible, pero con peor encaje en
cada entorno).

## 9. Momento de emisión del ticket (FR-010, SC-008)

**Decisión**: el ticket se emite **una sola vez**, en la misma transacción que cierra la
cuenta: al pagar la última parte pendiente de una cuenta dividida o al confirmar el pago
único. Antes de ese momento el ticket está `no_emitido`: las partes intermedias no generan
tickets provisionales y `GET .../cuenta/ticket` responde `409` mientras la cuenta siga abierta.
El estado `emitido` se deriva de la cuenta cerrada y `generadoEn` es su `cerrada_en`; no se
persiste una tabla de tickets.

**Rationale**: cumple las clarificaciones del 2026-10-20 y SC-008, y evita documentos
duplicados o inconsistentes si el camarero marca y desmarca partes antes de terminar el cobro.
Derivar el estado de la cuenta mantiene el Principio I (sin tabla ni estados adicionales).

**Alternativas consideradas**: un ticket por cada parte (descartado: la spec exige uno único);
emitir el ticket al confirmar la división (descartado: todavía no se ha cobrado y podría
revertirse); guardar tickets en una tabla propia (innecesario: el ticket se recompone de la
cuenta cerrada).

## 10. Reversión de una parte pagada sin integración con terminales

**Decisión**: deshacer la marca de una parte es una operación de estado, no un reembolso: la
parte vuelve a `pendiente` y se limpia `pagada_en`. Solo se permite mientras la cuenta y la
cuenta esté abierta; tras cerrarse la última parte, la cuenta ya está cerrada y la reversión se
rechaza. El sistema no se integra con terminales de pago: el cobro lo confirma el camarero y
la aplicación solo registra el estado de cada parte.

**Rationale**: cumple FR-016 y SC-009 sin introducir devoluciones, pasarelas ni estados de
cobro que la spec no pide (Principio III). Al no existir ticket antes de la última parte, la
reversión no requiere anular ni reemitir ningún documento.

**Alternativas consideradas**: integrar la reversión con el terminal de pago (fuera de
alcance); impedir la reversión una vez marcada (contradice la clarificación); permitirla tras
el cierre (obligaría a reabrir la cuenta, fuera de alcance en v1).

## 11. Reutilización de la mesa tras el cobro (FR-011, FR-012, clarificación 2026-10-27)

**Decisión**: al cerrar la cuenta, `mesas.estado` pasa a `libre`; la mesa vuelve a aparecer en
sala y puede abrir una nueva comanda. La cuenta cerrada se conserva como histórico y no se
reabre. La nueva comanda crea un pedido y una cuenta nuevos; la consulta de cuenta/ticket por
mesa devuelve el registro correspondiente a la comanda o al cierre más reciente. Para soportarlo se
añade `cuentas.pedido_id` y se consulta la cuenta por el pedido actual; así una cuenta cerrada
antigua no bloquea una comanda nueva de la misma mesa.

**Rationale**: evita mesas inutilizables y mantiene el histórico sin duplicar la entidad Mesa.
El estado `libre` ya existe en el esquema y es el que usa la historia 001 para permitir abrir.

**Alternativas consideradas**: mantener `cerrada` y permitir una reapertura explícita (añade un
estado y una operación que la spec no pide); liberar solo al día siguiente o mediante acción
manual (peor experiencia y más pasos).

## 12. Bloqueo del cierre por platos pendientes de cocina (FR-019, clarificación 2026-10-27)

**Decisión**: antes de cerrar la cuenta se consultan las líneas de pedidos `enviada` de la mesa.
Si alguna línea tiene `estado = 'pendiente'`, se rechaza el cierre con `409 platos_pendientes` y
se devuelve la lista de líneas pendientes. La interfaz muestra esa lista y mantiene la mesa
abierta. No se cancelan ni se marcan líneas automáticamente. El mismo bloqueo se aplica al
intentar pagar la última parte de una cuenta dividida.

**Rationale**: impide cobrar y liberar una mesa con comida aún en preparación, conserva la
información de cocina y evita que el camarero tenga que adivinar qué falta. No se introducen
estados nuevos: se lee el estado ya existente de las líneas.

**Alternativas consideradas**: cancelar pendientes y descontarlos del total (puede tirar comida
ya preparada y exige borrar consumos); marcarlos como servidos (falsea cocina); permitir el
cierre dejándolos pendientes (es el comportamiento actual defectuoso).

## 13. Autenticación y autorización heredadas de la historia 000

**Decisión**: todos los endpoints de cuenta se montan detrás de `autenticar` y
`requireRole('camarero')`. La identidad se obtiene solo de la cookie de sesión; no se aceptan
cabeceras de camarero ni parámetros de URL. Sin sesión se responde `401`; con otro rol, `403`.

**Rationale**: la historia 000 ya sustituyó la identidad simulada; 006 no debe reintroducirla.

**Alternativas consideradas**: mantener la identidad por cabecera para tests (dejaría un bypass
de autenticación); confiar solo en el guard de la interfaz (inseguro).
