# Phase 0 — Research: Marcar platos como listos

La spec no dejaba marcadores `[NEEDS CLARIFICATION]`. Los únicos puntos abiertos eran decisiones
técnicas que la constitución no fija explícitamente (lenguaje, almacén, canal de refresco y
pruebas). Se resuelven aquí con una decisión, su justificación y las alternativas evaluadas.

## R1. Lenguaje del proyecto

- **Decision**: JavaScript moderno (ES2022) tanto en frontend como en backend.
- **Rationale**: la constitución impone el stack (React + Chakra UI, ExpressJS sobre Node.js) con
  un principio explícito de simplicidad y de no añadir complejidad anticipada. JavaScript evita
  una capa de compilación/verificación de tipos que la versión 1 no exige; Vite y Express
  funcionan directamente con módulos ESM.
- **Alternatives considered**: TypeScript (mejor seguridad de tipos y contratos, pero añade
  compilación y configuración que la v1 no necesita). Revisable mediante enmienda si el equipo lo
  considera necesario.

## R2. Almacén de datos

- **Decision**: SQLite (librería `better-sqlite3`) como único almacén, en un fichero persistido en
  un volumen Docker.
- **Rationale**: es el almacén más simple que cumple el requisito de persistir pedidos, líneas y
  marcas de tiempo; no requiere un servicio adicional en `docker-compose`, encaja con el principio
  de simplicidad y su volumen de escritura es sobradamente suficiente para un restaurante.
- **Alternatives considered**: PostgreSQL (mejor concurrencia y crecimiento, pero añade un
  contenedor y configuración que la v1 no necesita); almacenamiento en memoria (no persistiría el
  momento de la marca ni sobreviviría reinicios).

## R3. Refresco en vivo de las pantallas

- **Decision**: Server-Sent Events (SSE) mediante `EventSource`, con las acciones del cocinero
  enviadas por REST.
- **Rationale**: el flujo de datos es unidireccional (del servidor a las pantallas de cocina y
  sala); SSE es un canal HTTP sencillo, con reconexión automática en el navegador, que permite
  reflejar la marca «sin recargar» con latencia casi inmediata. Cumple de sobra el objetivo de
  ≤5 s y respeta el principio de simplicidad.
- **Alternatives considered**: sondeo periódico (lo más simple, pero introduce retardo y tráfico);
  WebSocket (bidireccional, más potente de lo que la historia necesita).

## R4. Estrategia de pruebas

- **Decision**: Vitest como ejecutor común; React Testing Library para componentes y flujos del
  frontend; Supertest para los contratos de la API REST.
- **Rationale**: la constitución exige pruebas automatizadas por funcionalidad, escritas junto al
  desarrollo. Vitest sirve para frontend y backend, lo que reduce herramientas distintas; RTL
  valida el comportamiento visible y Supertest valida los contratos acordados.
- **Alternatives considered**: Jest (más configuración para ESM/Vite); Playwright (útil para e2e,
  se puede añadir más adelante sin bloquear la v1).

## R5. Estructura del repositorio

- **Decision**: monorepositorio con `backend/` y `frontend/`, más `docker-compose.yml` en la raíz.
- **Rationale**: un único repositorio facilita el trabajo del equipo (principio VII de la
  constitución), el arranque reproducible con Docker y la revisión conjunta de cambios que afectan
  a cocina y sala.
- **Alternatives considered**: dos repositorios separados (más aislamiento, pero peor encaje con
  el tamaño del equipo y con el arranque conjunto exigido).

## R6. Idempotencia y concurrencia del marcado

- **Decision**: la operación de marcar/deshacer se modela como una asignación idempotente de
  estado (`pendiente` | `listo`) sobre la línea del pedido, ejecutada en una transacción.
- **Rationale**: la spec exige que una marca no se pierda ni se duplique ante cortes o marcados
  simultáneos (FR-009, FR-010). Fijar el estado final deseado (en lugar de incrementar o alternar)
  hace la operación repetible sin efectos colaterales y conserva un único momento de marca.
- **Alternatives considered**: operación «toggle» (no idempotente, produce duplicados o cambios
  inesperados); uso de marcas de versión optimista explícitas (más complejo de lo necesario para
  este dominio).

## R7. Reversión desde un aviso temporal

- **Decision**: mostrar un toast de Chakra UI («Pedido completado») en la pantalla de cocina que
  conserva en el estado del cliente `pedidoId`/`lineaId` de la última marca y ofrece «Deshacer»
  durante al menos 10 s. La acción reutiliza la operación idempotente de desmarcar
  (`PUT /pedidos/{pedidoId}/lineas/{lineaId}/estado` con `estado: pendiente`); no se crea ningún
  endpoint ni entidad nuevos.
- **Rationale**: al completarse el pedido, este desaparece de la lista de cocina (FR-006) y el
  cocinero perdería el acceso a la línea; el aviso mantiene la reversión accesible sin retrasar la
  desaparición ni añadir complejidad. La duración mínima de 10 s se controla con un temporizador del
  navegador y se valida con temporizadores simulados en las pruebas del componente (SC-009,
  FR-014).
- **Alternatives considered**: modal bloqueante (interrumpe el servicio y exige cerrarlo antes de
  seguir); endpoint específico de «deshacer» con testigo del servidor (más piezas y estado que
  mantener para un caso que ya resuelve la asignación de estado); retrasar la desaparición del
  pedido para permitir deshacerlo (contradice FR-006 y SC-005).

## R8. Pedidos cancelados

- **Decision**: el endpoint de marcado rechaza líneas de pedidos en estado `cancelada` con
  `409 pedido_cancelado`; el pedido no aparece en la lista de cocina. La cancelación se comunica
  por SSE (`pedido.cancelado` / `pedido.pendientes-cambiado`).
- **Rationale**: no tiene sentido preparar un pedido que sala ha cancelado por completo; dejar las
  líneas marcables podría bloquear la mesa y falsear el estado de cocina (FR-017).
- **Alternatives considered**: mostrarlo como pendiente hasta que cocina lo complete (trabajo
  inútil); permitir marcarlo y cerrarlo (no refleja la cancelación real).

## R9. Cantidad de una línea ya lista

- **Decision**: si una línea `listo` cambia de cantidad en 002, el servicio de edición aplica:
  bajar o mantener → sigue `listo`; subir → vuelve a `pendiente` y limpia `listo_en`. La
  completitud de la mesa la recalcula 005.
- **Rationale**: lo ya preparado cubre una reducción; un aumento exige preparar unidades nuevas.
  Es la regla aprobada en 2026-11-03 y evita servir unidades no preparadas.
- **Alternatives considered**: cualquier cambio vuelve a pendiente (obliga a recocinar de más);
  seguir siempre lista (podría servir unidades no preparadas).

## R10. Bloqueo de edición de sala

- **Decision**: mientras 002 mantiene el pedido bloqueado (`editando_por` vigente), el endpoint de
  marcado responde `423 pedido_bloqueado`; al liberarse, cocina opera sobre el estado resultante.
- **Rationale**: evita que cocina marque un plato que el camarero está retirando o cambiando; la
  clarificación 2026-11-03 eligió esta opción por simplicidad.
- **Alternatives considered**: permitir cocina y descartar marcas al retirar (más complejo y
  propenso a contradicciones); bloquear solo las líneas ya listas (reglas asimétricas).

## R11. Disponibilidad de la carta

- **Decision**: un cambio de disponibilidad en 008 no retira la línea de un pedido enviado; la
  línea sigue pendiente y puede marcarse. Si el plato no se puede preparar, el camarero lo retira o
  cancela el pedido según 002.
- **Rationale**: respeta el pedido ya aceptado y evita modificaciones silenciosas; la decisión de
  2026-11-03 remite el tratamiento a 002.
- **Alternatives considered**: retirar automáticamente la línea (sorprende a cocina y al cliente);
  bloquear la baja de la carta mientras haya pedidos (impide gestionar la carta).
