# Phase 0 — Research: Cierre y división de cuenta

Este documento resuelve las incógnitas del *Technical Context* y fija las decisiones de
diseño para la historia 006. Formato: Decisión / Rationale / Alternativas consideradas.

## 0. Contexto de proyecto (stack ya fijado)

**Decisión**: la historia 006 reutiliza las decisiones técnicas ya fijadas a nivel de proyecto
por el plan de la historia 005 (y aplicables a las historias 01–08): JavaScript (ES2022) sobre
Node.js 20 LTS, React 18 + Chakra UI en el frontend, ExpressJS 4 en el backend, SQLite
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

## 2. Modelo de la cuenta: abierta (derivada) y cerrada (persistida)

**Decisión**: mientras la mesa está abierta, la **cuenta abierta es un modelo derivado** que
se calcula desde los consumos (no se persiste). Al confirmar el cobro se persiste una fila de
`cuentas` con su estado `cerrada`, su total y el momento del cierre, junto con sus partes y
asignaciones, en una única transacción.

**Rationale**: evita "borradores" y estados intermedios que habría que limpiar si el camarero
cancela (FR-004); el total siempre refleja el estado real de la mesa hasta que se cierra. El
Principio I pide no persistir lo que todavía no hace falta.

**Alternativas consideradas**: crear la cuenta al abrir la mesa (propiedad de otra historia y
complejidad innecesaria); persistir un borrador de cuenta al iniciar el cierre y borrarlo al
cancelar (más estados y limpieza).

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
asignación se hace al cerrar; permitir porciones cubre el caso de un plato compartido sin
perder la coincidencia con el total (FR-009).

**Alternativas consideradas**: obligar a asignar cada consumo a una única parte (no cubre
platos compartidos); guardar solo el importe de cada parte sin detalle (impide comprobar que
todo lo consumido está asignado).

## 5. Detección de cambios y reinicio de la división (FR-017)

**Decisión**: la división se apoya en un **total base** (el total sobre el que se construyó).
Al confirmar el cierre, el backend recalcula el total actual y, si difiere del total base
enviado, rechaza la operación (`422`) e indica que la cuenta cambió; la pantalla vuelve a
cargar la cuenta con el total actualizado y el camarero rehace la división.

**Rationale**: cumple FR-017 sin bloquear el pedido (evita introducir estados de "división
vigente" y su limpieza) y sin un canal de tiempo real propio; el caso de edición concurrente
es poco frecuente y se resuelve en el momento de confirmar (Principio I).

**Alternativas consideradas**: bloquear la cuenta mientras se divide (como la edición de
pedido de la historia 02: más complejidad y estados); suscribirse a eventos para reiniciar en
vivo (no exigido por la spec).

## 6. Pago por partes y cierre transaccional (FR-011, FR-014, FR-016, SC-005, SC-007)

**Decisión**: el camarero marca cada parte como pagada por separado en la pantalla de cierre;
la operación de cierre se habilita solo cuando **todas** las partes están marcadas como
pagadas. El backend valida en una única transacción que el total coincide, que las partes
suman el total y que ninguna parte queda pendiente; entonces persiste la cuenta y sus partes,
marca la mesa como cerrada y responde con el ticket. Cerrar una cuenta ya cerrada se rechaza
(`409`).

**Rationale**: cumple FR-016 y SC-007 (la mesa se cierra solo con todas las partes pagadas) y
FR-014 (no se reabre una cuenta cerrada). La transacción evita cierres parciales o dobles.

**Alternativas consideradas**: persistir cada pago de parte al marcarlo (borradores: más
estados y limpieza); cerrar con partes pendientes y cobrarlas después (contradice la spec).

## 7. Notificación a la vista de sala (integración con la historia 005)

**Decisión**: al cerrar la mesa, el backend emite el evento `mesa-cerrada` por el **hub SSE ya
existente** (historia 005), para que las pantallas de sala dejen de mostrar la mesa. La
pantalla de cierre de 006 no se suscribe a tiempo real: carga la cuenta por HTTP y valida el
total al confirmar.

**Rationale**: mantiene coherentes sala y cierre sin introducir un canal de tiempo real nuevo
(Principio I) y sin duplicar infraestructura; la historia 006 no necesita refresco en vivo
propio.

**Alternativas consideradas**: que la historia 006 tuviera su propio canal en vivo (innecesario);
no notificar (la vista de sala mostraría mesas cerradas hasta recargar).

## 8. Pruebas automatizadas y verificación

**Decisión**: backend con Vitest + Supertest (contrato de las rutas de cuenta y cierre; cálculo
del total; redondeo de céntimos en partes iguales; validación de la división; cierre
transaccional; rechazo de cuenta ya cerrada y de partes pendientes) y frontend con Vitest +
React Testing Library (resumen del total, división en ambos modos, ticket y estado de error).
Los criterios de éxito se comprueban además con los escenarios de `quickstart.md`.

**Rationale**: cumple la regla de "pruebas junto a la funcionalidad" de la constitución y hace
verificables los redondeos y el bloqueo de mesa, que son los puntos más propensos a fallar.

**Alternativas consideradas**: un único *runner* para todo (posible, pero con peor encaje en
cada entorno).
