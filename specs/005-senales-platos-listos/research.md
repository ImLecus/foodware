# Phase 0 — Research: Señales de platos listos por mesa

Este documento resuelve las incógnitas del *Technical Context* y fija las decisiones de
diseño para la historia 005. Formato: Decisión / Rationale / Alternativas consideradas.

> **Contexto de partida (repositorio real)**: el esqueleto base con las historias 001–003 ya
> está implementado sobre ExpressJS + SQLite (`better-sqlite3`) + React/Vite, con un **hub SSE
> compartido** (`backend/src/realtime/hub.js`), migraciones versionadas en `backend/migrations/`
> y un esquema compartido (`001_init.sql`) que ya define `mesas`, `pedidos`, `lineas_pedido`
> (`estado`, `listo_en`) y la tabla `avisos`. La historia 004 (marcar listos en cocina) **no
> está implementada**: nada pone un plato en estado `listo`.

## 1. Cómo mantener el estado al día sin recargar (FR-004, FR-012)

**Decisión**: Server-Sent Events (SSE) sobre la API HTTP de Express, reutilizando el **hub SSE
compartido** ya existente (`backend/src/realtime/hub.js`); el cliente usa el `EventSource`
nativo del navegador a través del envoltorio existente (`frontend/src/services/realtime.js`).

**Rationale**: la comunicación es de un solo sentido (el servidor empuja cambios de estado
y avisos; el camarero solo descarta, y eso va por HTTP normal). SSE es nativo del navegador,
no añade dependencias, se reconecta solo (apoya FR-014 y SC-008), reutiliza la infraestructura
ya presente (el mismo hub que usan cocina y sala) y encaja con la "API HTTP de Express" de la
constitución. Es más simple que un canal bidireccional y evita duplicar el canal de eventos.

**Alternativas consideradas**:
- *Polling periódico*: lo más simple de implementar, pero desperdicia peticiones y ofrece
  peor latencia; además no cubre por sí solo el aviso en tiempo real.
- *WebSocket / Socket.IO*: bidireccional y potente, pero innecesario aquí y añade una
  librería (Socket.IO) no contemplada por la constitución.
- *Canal SSE propio para sala*: descartado por duplicar el hub; se usa el compartido.

## 2. Persistencia del estado y de los avisos

**Decisión**: reutilizar el SQLite del repositorio (fichero persistido en un volumen Docker,
`better-sqlite3`, migraciones versionadas). El esquema compartido `001_init.sql` ya incluye la
tabla `avisos` y las columnas `estado`/`listo_en` de `lineas_pedido`, por lo que esta historia
**no añade ninguna migración nueva** ni modifica el esquema base.

**Rationale**: el estado de los platos y los avisos deben sobrevivir a recargas y ser
coherentes entre varias pantallas (cocina y sala). SQLite ya es la persistencia del producto;
añadir otro almacén o una migración sería complejidad no exigida (principio I). No usar ORM
mantiene la simplicidad y coincide con el resto de historias.

**Alternativas consideradas**:
- *Estado en memoria*: se pierde al reiniciar y no soporta bien varias pantallas; contradice
  FR-010 (recordar qué avisos se descartaron).
- *Nueva migración 004_avisos.sql*: innecesaria; la tabla `avisos` ya existe en el esquema base.
- *ORM (Prisma/Sequelize)*: añade una capa y dependencias frente al principio de simplicidad.

## 3. Lenguaje: JavaScript o TypeScript

**Decisión**: JavaScript (ES2022) con módulos ES, tanto en backend como en frontend.

**Rationale**: la constitución nombra React y ExpressJS sobre Node sin imponer TypeScript, y el
repositorio ya está en JavaScript. Se mantiene la coherencia con las historias 001–003 y menos
configuración para un equipo de 4 personas. Los tipos se sustituyen por validación explícita en
los límites de la API (con `zod`, ya presente en el backend) y por pruebas.

**Alternativas consideradas**: *TypeScript*: más seguridad en tiempo de compilación, pero
mayor configuración, ruido y ruptura con el código existente para el alcance de la versión 1.

## 4. Detección del aviso de mesa completa y su ciclo de vida (FR-005 a FR-010, FR-013)

**Decisión**: la completitud de una mesa se **calcula** (una mesa está abierta mientras tenga
una comanda en curso o ya enviada a cocina y no se haya cerrado su cuenta; está completa si
está abierta y **todos los platos de la comanda ya enviada a cocina** están en estado `listo`;
una mesa sin platos enviados nunca está completa). Cuando pasa de no completa a completa, el
sistema crea un aviso `activo`; si vuelve a haber un plato pendiente, el aviso deja de estar
activo (se retira). Descartar un aviso lo pasa a `descartado` y no vuelve a generarse hasta
que se marque un nuevo plato como listo en esa mesa. Al **cerrarse la cuenta** de la mesa, su
aviso activo se retira y deja de mostrarse (FR-010). La completitud se recalcula con el mismo
criterio tras **cualquier cambio** en las líneas enviadas, incluida la **edición de una
comanda ya enviada** (añadir, cambiar o retirar un plato, historia 02): los platos listos que
no se tocan siguen listos, y un plato nuevo entra `pendiente` y retira el aviso si deja la
mesa incompleta.

**Punto de integración del recálculo tras edición (FR-013)**: el recálculo **no** se hace al
añadir/cambiar/retirar cada línea (esas operaciones solo registran el cambio pendiente), sino
al **confirmar los cambios** de la comanda ya enviada, en `POST
/api/pedidos/:pedidoId/enviar-cambios` (`backend/src/routes/pedidos.js`). Ese es el punto
donde la historia 002 agrupa el pedido actualizado (`por_partida`) y publica en el hub; la 005
lo amplía para recalcular la completitud de la mesa y emitir los eventos de sala. Así el
recálculo coincide con la semántica real del flujo (una edición no está "aplicada" hasta que se
envía a cocina) y no se duplica lógica en tres endpoints distintos.

**Rationale**: recalcular en cada cambio mantiene el aviso siempre coherente con el estado
real y cubre la reversibilidad de FR-013 y la edición de comandas sin estados "zombi". Guardar
el aviso (en lugar de derivarlo solo) es necesario para recordar qué mesas ya fueron
descartadas (FR-010). Limitar la completitud a los platos **enviados** (FR-001/FR-005) refleja
exactamente lo que cocina puede marcar: los platos aún sin enviar no pueden ponerse a `listo`
y, si contaran, bloquearían la completitud de la mesa para siempre.

**Alternativas consideradas**:
- Derivar el aviso solo del estado de los platos, sin persistirlo: no permite recordar el
  descarte y haría reaparecer el aviso indebidamente.
- Contar todos los platos de la comanda (enviados o no): impediría que una mesa se considere
  completa mientras quede algo sin enviar a cocina (contradice FR-005 tal como se clarificó).

## 5. Señal visual y sonora del aviso (FR-006)

**Decisión**: la señal visual es siempre una tarjeta/banda destacada y persistente en la vista
de la mesa (obligatoria). La señal sonora está **activada por defecto**, suena **una sola vez**
al generarse el aviso y se puede **silenciar y reactivar** desde la pantalla de sala mediante un
control visible (Chakra UI); el estado del control se conserva en el navegador. La señal visual
nunca depende del sonido.

**Rationale**: cumple que la señal visual funcione con el dispositivo silenciado y que el aviso
no se repita solo, y respeta la clarificación del 2026-10-20 (sonido activado por defecto con
control en la pantalla). No se usan notificaciones del sistema operativo ni *service workers*
para no añadir complejidad ni permisos.

**Alternativas consideradas**: notificaciones nativas del sistema (requieren permisos y
complejidad), repetición periódica del sonido (molesta y contradice "no se repite solo"), o
sonido sin control propio (no permite silenciarlo desde la app).

## 6. Comportamiento sin conexión y resincronización (FR-014, SC-008)

**Decisión**: la app exige conexión. Al perderse (fallo de `fetch` o cierre del SSE) se
muestra un indicador de "sin conexión", se marca la información como no actualizada y se
deshabilita descartar el aviso. Al recuperar la conexión, se vuelve a pedir el estado
completo (instantánea) y se reabre el SSE, quedando al día en ≤ 10 s.

**Rationale**: coincide con las suposiciones de las historias 03 y 04 (exigir conexión) y
evita estados parciales; la instantánea tras reconectar garantiza coherencia sin tener que
reconstruir el historial de eventos.

**Alternativas consideradas**: funcionar en modo offline con escritura diferida; queda fuera
de alcance y complicaría la coherencia entre pantallas.

## 7. Identidad y privacidad del camarero

**Decisión**: no se introduce inicio de sesión. Se reutiliza el middleware ya existente
(`backend/src/middleware/camarero.js`), que identifica al camarero por la cabecera
`X-Camarero-Id` (con valor por defecto). La vista de sala no filtra por camarero: muestra todas
las mesas abiertas (FR-011).

**Rationale**: la spec declara que las mesas son compartidas y que el inicio de sesión queda
fuera de alcance; además respeta el principio de pedir solo los datos imprescindibles.

**Alternativas consideradas**: mesas asignadas por camarero (descartado por la clarificación
de la spec).

## 8. Pruebas automatizadas

**Decisión**: backend con Vitest + Supertest (contratos de API, completitud, ciclo del aviso y
marcado de líneas); frontend con Vitest + React Testing Library (distinción visual, estados
vacío/carga, aviso, control de sonido y flujo sin conexión). Se reutiliza el arnés existente
`backend/tests/ayuda.js` (app + BD en memoria + cliente SSE falso).

**Rationale**: son las herramientas estándar ya configuradas en el repositorio, cumplen la regla
de "pruebas junto a la funcionalidad" y no requieren configuración exótica.

**Alternativas consideradas**: un único runner para todo (posible, pero con peor encaje en
cada entorno y distinto del ya establecido).

## 9. Descarte global del aviso y sincronización de pantallas (FR-009, FR-010, SC-009)

**Decisión**: el descarte se persiste como estado **global de la mesa** (aviso
`activo → descartado`) y el backend lo difunde a **todos** los clientes conectados al hub
SSE compartido mediante el evento `aviso.descartado` (convención `punto.minuscula`, igual que
`linea.actualizada`/`pedido.modificado` ya existentes en `realtime/emit.js`). La pantalla que
origina el descarte actualiza su estado al recibir la confirmación HTTP; el resto lo hace al
recibir el evento. Todas las pantallas convergen al mismo estado en ≤ 5 s.

**Rationale**: la clarificación del 2026-10-20 exige que el aviso desaparezca para todos
los camareros y en todas las pantallas. Un estado global en la base de datos, sumado a la
difusión por el mismo canal SSE que ya mantiene la vista al día, evita guardar estado por
dispositivo y garantiza coherencia entre pantallas. La instantánea de `GET
/api/sala/mesas` al reconectar corrige cualquier evento perdido (FR-014).

**Alternativas consideradas**: estado de descarte local por dispositivo o por camarero
(contradice FR-009/FR-010 y produce avisos incoherentes); sondeo periódico para propagar
el descarte (mayor latencia y peticiones innecesarias).

## 10. Mecanismo mínimo de marcado de platos (FR-016)

**Decisión**: añadir un único endpoint que marca y deshace la marca de una línea de un pedido
**ya enviado a cocina**: `PUT /api/pedidos/{pedidoId}/lineas/{lineaId}/estado` con un cuerpo
`{ "estado": "listo" | "pendiente" }`. Al marcar, fija `estado = 'listo'` y `listo_en`; al
deshacer, `estado = 'pendiente'` y `listo_en = NULL`. Tras cada cambio, se recalcula la
completitud de la mesa y se emiten los eventos SSE correspondientes (`linea.actualizada` y, si
procede, `aviso.activo`/`aviso.retirado`). Las claves JSON siguen el `snake_case` del resto de
la API (`pedido_id`, `mesa_id`, `marcado_en`); el evento `linea.actualizada` reutiliza el
`data` ya existente (`{ pedidoId, lineaId, estado }`). La entrada se valida con `zod`.

**Rationale**: hoy nada pone un plato en `listo`, por lo que sin este mecanismo la historia no
se podría probar de extremo a extremo (FR-016). Se implementa lo **mínimo**: un endpoint
idempotente y reutilizable, sin pantalla de cocina ni aviso temporal "Pedido completado", que
son alcance de la historia 004. Es coherente con `contracts/openapi.yaml` de la historia 004
(misma ruta y semántica), de modo que la 004 podrá reutilizarlo sin cambios.

**Alternativas consideradas**:
- Dejar la 005 como solo lectura: impide cualquier validación de extremo a extremo y deja la
  funcionalidad no demostrable (descartado).
- Implementar antes la historia 004 completa: fuera del alcance de esta historia y bloquea el
  trabajo; la 004 aportará después su pantalla y su aviso temporal sobre este mismo endpoint.
