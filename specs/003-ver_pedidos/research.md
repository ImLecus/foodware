# Phase 0 — Research: Ver pedidos pendientes en cocina

La spec no dejó marcadores `[NEEDS CLARIFICATION]` (se resolvieron por clarificación antes del
plan). Los puntos abiertos son decisiones técnicas ya fijadas de forma compartida; se consolidan
aquí con su justificación y alternativas.

## R1. Stack, lenguaje y estructura

- **Decision**: se reutilizan las decisiones del plan compartido del proyecto (primer plan,
  `004-marcar_listos`): JavaScript ES2022, Node.js 20, React 18 + Chakra UI, ExpressJS 4, Vite,
  SQLite (`better-sqlite3`), monorepositorio `backend/` + `frontend/` con `docker-compose.yml`.
- **Rationale**: la constitución fija el stack (React + Chakra UI, ExpressJS, Docker) y el
  principio de simplicidad; mantener las mismas decisiones evita divergencias entre historias.
- **Alternatives considered**: TypeScript o PostgreSQL (descartados por simplicidad en la v1);
  un repositorio por capa (peor encaje con el arranque conjunto).

## R2. Refresco en vivo de la vista

- **Decision**: Server-Sent Events (SSE) por partida; la lista inicial se obtiene por REST y los
  cambios llegan como eventos que disparan la actualización sin recargar.
- **Rationale**: el flujo es unidireccional (servidor → pantalla de cocina). SSE es simple, con
  reconexión automática en el navegador, y cumple el objetivo de ≤5 s (FR-009, FR-011, SC-005,
  SC-006).
- **Alternatives considered**: sondeo periódico (más simple pero con retardo y tráfico); WebSocket
  (bidireccional, más de lo necesario).

## R3. Orden de la lista (tiempo de espera y desempate)

- **Decision**: el backend devuelve la lista ya ordenada por `enviadoEn` ascendente y, ante
  empate, por identificador creciente (orden de llegada).
- **Rationale**: ordenar en el servidor garantiza un resultado determinista e idéntico para todas
  las pantallas (FR-004, SC-002) y respeta el desempate acordado en la clarificación.
- **Alternatives considered**: ordenar en cliente (riesgo de divergencia y de reordenaciones por
  redondeo de fechas).

## R4. Tiempo transcurrido y su actualización

- **Decision**: el servidor entrega el instante de envío (`enviadoEn`); el cliente calcula y
  refresca el tiempo transcurrido con un temporizador local (p. ej. cada 30 s) y lo muestra en
  minutos (y horas cuando proceda).
- **Rationale**: evita tráfico continuo y mantiene la cifra al día mientras el pedido sigue en
  pantalla (FR-005, FR-006, SC-003); el cálculo se basa en el envío original, sin reiniciarse por
  ediciones (FR-015).
- **Alternatives considered**: recalcular en cada evento del servidor (no actualizaría entre
  eventos); enviar el tiempo desde el servidor (más tráfico y desincronización aparente).

## R5. Identidad del cocinero y su partida

- **Decision**: se reutiliza la identidad/asignación existente; el frontend obtiene la partida del
  cocinero desde el backend y no se introduce inicio de sesión nuevo.
- **Rationale**: la historia asume una partida ya asignada (FR-001) y la constitución pide
  minimizar datos; añadir autenticación aquí sería alcance fantasma.
- **Alternatives considered**: login propio de cocina (más complejidad y datos); selección manual
  de partida (no refleja una partida «asignada»).

## R6. Comportamiento sin conexión

- **Decision**: la vista exige conexión. Ante una caída, muestra un indicador de «sin conexión»,
  marca la información como no actualizada y no permite confirmar cambios; al restablecerse,
  vuelve a pedir la lista vigente (vía REST + reconexión SSE).
- **Rationale**: procede de la clarificación aprobada de la spec; mantiene la coherencia y evita
  operar sobre datos obsoletos (edge case de conexión, FR-011).
- **Alternatives considered**: modo offline con caché (complejidad no justificada en la v1).

## R7. Filtrar por partida y estado «pendiente»

- **Decision**: la consulta de pendientes filtra por `partidaId` y por pedidos con al menos una
  línea no lista; la partida del cocinero define el filtro.
- **Rationale**: es el núcleo de la historia (FR-002, FR-003, FR-008) y evita mostrar pedidos de
  otras partidas.
- **Alternatives considered**: filtrar en cliente todos los pedidos (más datos y riesgo de fuga de
  pedidos ajenos a la partida).
