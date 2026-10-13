# Phase 0 — Research: Señales de platos listos por mesa

Este documento resuelve las incógnitas del *Technical Context* y fija las decisiones de
diseño para la historia 005. Formato: Decisión / Rationale / Alternativas consideradas.

## 1. Cómo mantener el estado al día sin recargar (FR-004, FR-012)

**Decisión**: Server-Sent Events (SSE) sobre la API HTTP de Express; el cliente usa el
`EventSource` nativo del navegador.

**Rationale**: la comunicación es de un solo sentido (el servidor empuja cambios de estado
y avisos; el camarero solo descarta, y eso va por HTTP normal). SSE es nativo del navegador,
no añade dependencias, se reconecta solo (apoya FR-014 y SC-008) y encaja con la
"API HTTP de Express" de la constitución. Es más simple que un canal bidireccional.

**Alternativas consideradas**:
- *Polling periódico*: lo más simple de implementar, pero desperdicia peticiones y ofrece
  peor latencia; además no cubre por sí solo el aviso en tiempo real.
- *WebSocket / Socket.IO*: bidireccional y potente, pero innecesario aquí y añade una
  librería (Socket.IO) no contemplada por la constitución.

## 2. Persistencia del estado y de los avisos

**Decisión**: PostgreSQL 16 en contenedor, accedido con SQL sencillo mediante `pg` y
migraciones versionadas en el repositorio.

**Rationale**: el estado de los platos y los avisos deben sobrevivir a recargas y ser
coherentes entre varias pantallas (cocina y sala). PostgreSQL es robusto para accesos
concurrentes y encaja con el arranque en Docker. Usar SQL directo y migraciones mantiene
la simplicidad y evita un ORM (que sería complejidad no exigida).

**Alternativas consideradas**:
- *Estado en memoria*: válido para una demo, pero se pierde al reiniciar y no soporta bien
  varias instancias; no sirve para el resto del producto (historias 01–08).
- *SQLite*: sencillo, pero menos adecuado con varias pantallas escribiendo a la vez y con
  el despliegue en contenedores previsto.
- *ORM (Prisma/Sequelize)*: añade una capa y dependencias frente al principio de simplicidad.

## 3. Lenguaje: JavaScript o TypeScript

**Decisión**: JavaScript (ES2022) con módulos ES, tanto en backend como en frontend.

**Rationale**: la constitución nombra React y ExpressJS sobre Node sin imponer TypeScript;
JavaScript mantiene el proyecto sencillo y con menos configuración para un equipo de 4
personas. Los tipos se sustituyen por validación explícita en los límites (API) y pruebas.

**Alternativas consideradas**: *TypeScript*: más seguridad en tiempo de compilación, pero
mayor configuración y ruido para el alcance de la versión 1.

## 4. Detección del aviso de mesa completa y su ciclo de vida (FR-005 a FR-010, FR-013)

**Decisión**: la completitud de una mesa se **calcula** (una mesa está completa si está
abierta y todos sus platos están en estado "listo"). Cuando pasa de no completa a completa,
el sistema crea un aviso `activo`; si vuelve a haber un plato pendiente, el aviso deja de
estar activo (se retira). Descartar un aviso lo pasa a `descartado` y no vuelve a
generarse hasta que se marque un nuevo plato como listo en esa mesa.

**Rationale**: recalcular en cada cambio mantiene el aviso siempre coherente con el estado
real y cubre la reversibilidad de FR-013 sin estados "zombi". Guardar el aviso (en lugar de
derivarlo solo) es necesario para recordar qué mesas ya fueron descartadas (FR-010).

**Alternativas consideradas**: derivar el aviso solo del estado de los platos, sin
persistirlo; no permite recordar el descarte y haría reaparecer el aviso indebidamente.

## 5. Señal visual y sonora del aviso (FR-006)

**Decisión**: la señal visual es siempre una tarjeta/banda destacada y persistente en la
vista de la mesa (obligatoria); la sonora es un pitido opcional que suena **una sola vez**
al generarse el aviso, activable/silenciable en el dispositivo, sin repetirse.

**Rationale**: cumple que la señal visual nunca dependa del sonido (funciona con el
dispositivo silenciado) y que el aviso no se repita solo. No se usan notificaciones del
sistema operativo ni *service workers* para no añadir complejidad ni permisos.

**Alternativas consideradas**: notificaciones nativas del sistema (requieren permisos y
complejidad), o repetición periódica del sonido (molesta y contradice "no se repite solo").

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

**Decisión**: no se introduce inicio de sesión. La vista de sala no filtra por camarero:
muestra todas las mesas abiertas (FR-011). Se reutiliza, si existe, la identidad ya
establecida en las historias 03/04.

**Rationale**: la spec declara que las mesas son compartidas y que el inicio de sesión queda
fuera de alcance; además respeta el principio de pedir solo los datos imprescindibles.

**Alternativas consideradas**: mesas asignadas por camarero (descartado por la clarificación
de la spec).

## 8. Pruebas automatizadas

**Decisión**: backend con Jest + Supertest (contratos de API, completitud y ciclo del aviso);
frontend con Vitest + React Testing Library (distinción visual, estados vacío/carga, aviso y
flujo sin conexión).

**Rationale**: son las herramientas estándar de cada entorno, cumplen la regla de "pruebas
junto a la funcionalidad" y no requieren configuración exótica.

**Alternativas consideradas**: un único runner para todo (posible, pero con peor encaje en
cada entorno).
