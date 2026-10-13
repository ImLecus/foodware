---
description: "Task list for feature 003-ver_pedidos"
---

# Tasks: Ver pedidos pendientes en cocina

**Input**: Design documents from `/specs/003-ver_pedidos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluidas. La constitución de Foodware exige pruebas automatizadas por funcionalidad
(«sin pruebas, la funcionalidad no está completa»), por lo que cada historia incluye tareas de
prueba antes de su implementación.

**Organization**: Tareas agrupadas por historia de usuario (US1, US2, US3) para permitir
implementación y prueba independientes.

> **Nota**: las fases Setup y Foundational son del proyecto compartido; si ya se completaron al
> implementar la primera historia, pueden darse por hechas y empezar en la Fase 3.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (ficheros distintos, sin dependencias)
- **[Story]**: historia a la que pertenece (US1, US2, US3)
- Cada tarea incluye la ruta exacta del fichero

## Path Conventions

Aplicación web (monorepositorio): `backend/src/`, `backend/tests/`, `frontend/src/`,
`frontend/tests/`, y `docker-compose.yml` en la raíz.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto y estructura básica

- [ ] T001 Create monorepo structure (`backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`) and root `docker-compose.yml` per plan
- [ ] T002 [P] Init backend Node project in `backend/package.json` with `express`, `better-sqlite3`; dev deps `vitest`, `supertest`
- [ ] T003 [P] Init frontend project in `frontend/package.json` and `frontend/vite.config.js` with `vite`, `react`, `react-dom`, `@chakra-ui/react`; dev deps `vitest`, `@testing-library/react`, `jsdom`
- [ ] T004 [P] Configure ESLint + Prettier in `backend/.eslintrc.cjs` and `frontend/.eslintrc.cjs`
- [ ] T005 [P] Create `backend/Dockerfile` and `frontend/Dockerfile`
- [ ] T006 [P] Create frontend entry with Chakra provider and route to the kitchen view in `frontend/src/main.jsx` and `frontend/src/App.jsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura base que MUST estar lista antes de cualquier historia

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [ ] T007 Create SQLite connection and schema/migrations for `partidas`, `usuarios`, `mesas`, `pedidos` (with `enviadoEn`, `modificadoEn`) and `lineas_pedido` (with `estado`, `listoEn`) in `backend/src/db/index.js` and `backend/src/db/schema.js`
- [ ] T008 [P] Create seed data with pending orders across partidas, tables and distinct ages in `backend/src/db/seed.js`
- [ ] T009 [P] Create Express app skeleton, config and error-handling middleware in `backend/src/app.js`, `backend/src/server.js`, `backend/src/config/env.js`, `backend/src/middleware/error.js`
- [ ] T010 [P] Implement data-access models for partidas, mesas and usuarios in `backend/src/models/partida.js`, `backend/src/models/mesa.js`, `backend/src/models/usuario.js`
- [ ] T011 [P] Create frontend REST client and SSE subscription service in `frontend/src/services/api.js` and `frontend/src/services/events.js`

**Checkpoint**: base lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Ver los pedidos pendientes de mi partida, ordenados por espera (Priority: P1) 🎯 MVP

**Goal**: el cocinero ve solo los pedidos pendientes de su partida, ordenados del más antiguo al
más reciente, con estados vacío y «sin partida».

**Independent Test**: con pedidos pendientes en varias partidas, abrir la vista con una partida y
comprobar el filtrado y el orden (y los estados vacío y sin partida).

### Tests for User Story 1 ⚠️ (escribir primero, deben fallar)

- [ ] T012 [P] [US1] Contract test for `GET /partidas/{partidaId}/pedidos-pendientes` (filter by partida, exclude non-pending, order and tie-break) in `backend/tests/contract/pedidos-pendientes.test.js`
- [ ] T013 [P] [US1] Unit test for the pending-orders query (order by `enviadoEn` asc then `id` asc; exclude unassigned partida) in `backend/tests/unit/listar-pendientes.test.js`
- [ ] T014 [P] [US1] Component test for the kitchen list: filtered list, empty state and no-partida state in `frontend/tests/pages/CocinaPage.test.jsx`

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implement `pedido` and `lineaPedido` data-access and the pending-orders query in `backend/src/models/pedido.js` and `backend/src/models/lineaPedido.js`
- [ ] T016 [US1] Implement the service that lists pending orders of a partida (filter + deterministic order) in `backend/src/services/verPedidos.js`
- [ ] T017 [US1] Implement `GET /partidas/{partidaId}/pedidos-pendientes` and register the route in `backend/src/routes/partidas.js` and `backend/src/app.js`
- [ ] T018 [US1] Implement `GET /cocineros/{cocineroId}` returning the assigned partida (nullable) in `backend/src/routes/cocineros.js` and register it in `backend/src/app.js`
- [ ] T019 [P] [US1] Build kitchen page, order card, empty state and no-partida state in `frontend/src/pages/CocinaPage.jsx`, `frontend/src/components/PedidoCard.jsx`, `frontend/src/components/EstadoVacio.jsx`, `frontend/src/components/EstadoSinPartida.jsx`
- [ ] T020 [US1] Wire partida fetch and pending-orders load into the kitchen page in `frontend/src/pages/CocinaPage.jsx` and `frontend/src/services/api.js`

**Checkpoint**: US1 funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Ver el tiempo de espera y el detalle de cada pedido (Priority: P2)

**Goal**: cada pedido muestra el tiempo desde su envío original (actualizándose), la mesa de
origen y todos sus platos con cantidades, distinguiendo los ya listos.

**Independent Test**: con un pedido pendiente, comprobar el tiempo mostrado, su actualización, la
mesa y la lista de platos con cantidades y marcado de listos.

### Tests for User Story 2 ⚠️

- [ ] T021 [P] [US2] Contract test asserting `enviadoEn`, `mesa` and `lineas` (with `estado`/`listoEn`) in the response in `backend/tests/contract/detalle-pedido.test.js`
- [ ] T022 [P] [US2] Unit test that the elapsed time derives from the original `enviadoEn` and is not reset by an edit in `backend/tests/unit/tiempo-espera.test.js`
- [ ] T023 [P] [US2] Component test for the elapsed-time ticker and the plate list with ready marking in `frontend/tests/components/TiempoEspera.test.jsx`

### Implementation for User Story 2

- [ ] T024 [US2] Ensure the pending-orders response serializes `mesa` and all `lineas` (name, quantity, state, `listoEn`) in `backend/src/models/pedido.js` and `backend/src/routes/partidas.js`
- [ ] T025 [P] [US2] Implement the elapsed-time component with a local timer (minutes, hours if needed) in `frontend/src/components/TiempoEspera.jsx`
- [ ] T026 [P] [US2] Implement the plate-line component showing name, quantity and ready/pending distinction in `frontend/src/components/LineaPlato.jsx`
- [ ] T027 [US2] Wire the elapsed time, table and plate list into the order card in `frontend/src/components/PedidoCard.jsx`

**Checkpoint**: US1 y US2 funcionan de forma independiente

---

## Phase 5: User Story 3 - Mantener la lista actualizada durante el servicio (Priority: P3)

**Goal**: la lista se actualiza sola al llegar pedidos nuevos y se reordena al dejar de estar
pendientes, con aviso de «sin conexión» y recuperación al reconectar.

**Independent Test**: con la vista abierta, enviar un pedido nuevo (aparece en su posición) y
completar un pedido (desaparece y el resto se reordena), sin recargar.

### Tests for User Story 3 ⚠️

- [ ] T028 [P] [US3] Contract test for the SSE endpoint and event shapes (`pedido.nuevo`, `pedido.pendientes-cambiado`, `linea.actualizada`) in `backend/tests/contract/eventos-cocina.test.js`
- [ ] T029 [P] [US3] Integration test for live insertion and reordering (new order appears; completed order disappears) in `backend/tests/integration/lista-en-vivo.test.js`
- [ ] T030 [P] [US3] Component test for live updates without reload and the offline indicator in `frontend/tests/pages/CocinaPage.en-vivo.test.jsx`

### Implementation for User Story 3

- [ ] T031 [US3] Implement the SSE channel per partida and event emission in `backend/src/realtime/sse.js` and `backend/src/realtime/emit.js`
- [ ] T032 [US3] Implement `GET /partidas/{partidaId}/eventos` and register it in `backend/src/routes/partidas.js` and `backend/src/app.js`
- [ ] T033 [US3] Subscribe the kitchen page to SSE and refetch/reorder the list on events in `frontend/src/services/events.js` and `frontend/src/pages/CocinaPage.jsx`
- [ ] T034 [US3] Implement the offline indicator and reconnect resync (no duplicated/lost orders) in `frontend/src/components/AvisoSinConexion.jsx` and `frontend/src/services/events.js`

**Checkpoint**: las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: mejoras que afectan a varias historias

- [ ] T035 [P] Add backend logging for list queries and event emission in `backend/src/config/logger.js` and `backend/src/services/verPedidos.js`
- [ ] T036 [P] Document docker-compose usage and project setup in `README.md`
- [ ] T037 Run the validation guide in `specs/003-ver_pedidos/quickstart.md` end-to-end and fix gaps found
- [ ] T038 Verify full test suites pass and map results to FR-001…FR-016 in `backend/tests/` and `frontend/tests/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias (compartida con el proyecto)
- **Foundational (Phase 2)**: depende del Setup; BLOQUEA todas las historias
- **User Stories (Phase 3+)**: dependen de la fase Foundational
  - US1 (P1) primero; US2 (P2) y US3 (P3) después, en prioridad o en paralelo con equipo
- **Polish (Phase 6)**: depende de las historias a entregar

### User Story Dependencies

- **US1 (P1)**: arranca tras Foundational; sin dependencias de otras historias
- **US2 (P2)**: tras Foundational; amplía la tarjeta de pedido de US1 pero es probable por separado
- **US3 (P3)**: tras Foundational; reutiliza la lista de US1 y añade el canal en vivo

### Within Each User Story

- Pruebas primero (deben fallar), luego modelos, servicios, endpoints y UI
- Terminar una historia antes de pasar a la siguiente prioridad

### Parallel Opportunities

- Tareas [P] de Setup (T002–T006) en paralelo
- Tareas [P] de Foundational (T008–T011) en paralelo
- Dentro de cada historia, las pruebas [P] corren en paralelo
- Con equipo: un desarrollador por historia (US1, US2, US3) tras Foundational
- Atención: T017, T018 y T032 registran rutas en `backend/src/app.js`; no ejecutar en paralelo

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 en paralelo:
Task: "Contract test for GET /partidas/{partidaId}/pedidos-pendientes in backend/tests/contract/pedidos-pendientes.test.js"
Task: "Unit test for the pending-orders query in backend/tests/unit/listar-pendientes.test.js"
Task: "Component test for the kitchen list in frontend/tests/pages/CocinaPage.test.jsx"

# Modelos y UI de US1 en paralelo:
Task: "Implement pedido and lineaPedido data-access in backend/src/models/pedido.js and backend/src/models/lineaPedido.js"
Task: "Build kitchen page and components in frontend/src/pages/CocinaPage.jsx, frontend/src/components/PedidoCard.jsx, frontend/src/components/EstadoVacio.jsx, frontend/src/components/EstadoSinPartida.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (crítica)
3. Completar Phase 3: US1
4. **PARAR y VALIDAR** US1 de forma independiente
5. Demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → probar → demostrar (MVP: lista filtrada y ordenada)
3. US2 → probar → demostrar (tiempo, mesa y detalle)
4. US3 → probar → demostrar (actualización en vivo)
5. Cada historia añade valor sin romper las anteriores

### Parallel Team Strategy

1. El equipo completa Setup + Foundational
2. Tras Foundational: desarrollador A → US1, B → US2, C → US3
3. Las historias se integran de forma independiente

---

## Notes

- [P] = ficheros distintos, sin dependencias
- Cada historia es completable y probable por separado
- La constitución exige pruebas automatizadas por funcionalidad, escritas junto al desarrollo
- La constitución exige **parada por tarea** durante `/speckit.implement`: tras cada tarea, resumir
  lo hecho y esperar a que la persona revise y haga el commit antes de continuar
- Commits con Conventional Commits en español de España (constitución, principio VI)
- Evitar tareas vagas o que toquen el mismo fichero en paralelo sin dependencia
