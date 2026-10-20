---
description: "Task list for feature 004-marcar_listos"
---

# Tasks: Marcar platos como listos

**Input**: Design documents from `/specs/004-marcar_listos/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluidas. La constitución de Foodware exige pruebas automatizadas por funcionalidad
(«sin pruebas, la funcionalidad no está completa»), por lo que cada historia incluye tareas de
prueba antes de su implementación.

**Organization**: Tareas agrupadas por historia de usuario (US1, US2, US3) para permitir
implementación y prueba independientes.

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

- [X] T001 Create monorepo structure (`backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`) and root `docker-compose.yml` per plan
- [X] T002 [P] Init backend Node project in `backend/package.json` with `express`, `better-sqlite3`; dev deps `vitest`, `supertest`
- [X] T003 [P] Init frontend project in `frontend/package.json` and `frontend/vite.config.js` with `vite`, `react`, `react-dom`, `@chakra-ui/react`; dev deps `vitest`, `@testing-library/react`, `jsdom`
- [X] T004 [P] Configure ESLint + Prettier in `backend/.eslintrc.cjs` and `frontend/.eslintrc.cjs`
- [X] T005 [P] Create `backend/Dockerfile` and `frontend/Dockerfile`
- [X] T006 [P] Create frontend entry with Chakra provider in `frontend/src/main.jsx` and `frontend/src/App.jsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura base que MUST estar lista antes de cualquier historia

**⚠️ CRITICAL**: ninguna historia puede empezar hasta terminar esta fase

- [X] T007 Create SQLite connection and schema/migrations for `partidas`, `usuarios`, `mesas`, `pedidos`, `lineas_pedido` (with `estado` and `listoEn` columns) in `backend/src/db/index.js` and `backend/src/db/schema.js`
- [X] T008 [P] Create seed data (partidas, mesas, cocineros/camareros, pedidos de ejemplo) in `backend/src/db/seed.js`
- [X] T009 [P] Create Express app skeleton, config and error-handling middleware in `backend/src/app.js`, `backend/src/server.js`, `backend/src/config/env.js`, `backend/src/middleware/error.js`
- [X] T010 [P] Implement data-access models for partidas, mesas and usuarios in `backend/src/models/partida.js`, `backend/src/models/mesa.js`, `backend/src/models/usuario.js`
- [X] T011 [P] Create frontend REST client and SSE subscription service in `frontend/src/services/api.js` and `frontend/src/services/events.js`

**Checkpoint**: base lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Marcar un plato como listo desde la cocina (Priority: P1) 🎯 MVP

**Goal**: el cocinero marca (y deshace) un plato de un pedido pendiente de su partida; el plato
deja de contar como pendiente y los demás siguen pendientes; el pedido desaparece al completarse y
se ofrece un aviso «Pedido completado» con «Deshacer» durante al menos 10 s.

**Independent Test**: con un pedido pendiente de la partida del cocinero, marcar y deshacer un
plato, completar el pedido y usar «Deshacer» del aviso temporal; comprobar los estados y la
reaparición del pedido en la pantalla de cocina.

### Tests for User Story 1 ⚠️ (escribir primero, deben fallar)

- [X] T012 [P] [US1] Contract test for `PUT /pedidos/{pedidoId}/lineas/{lineaId}/estado` in `backend/tests/contract/marcar-estado.test.js`
- [X] T013 [P] [US1] Unit test for mark/undo service (validation by partida, idempotency, order completion) in `backend/tests/unit/marcar-listo-service.test.js`
- [X] T014 [P] [US1] Contract test for undoing the last line of a completed order (`estado: pendiente`, `listoEn: null`, and `409` still returned when marking `listo`) in `backend/tests/contract/desmarcar-completado.test.js`
- [X] T015 [P] [US1] Integration test for reopening after undo of the last line (line back to `pendiente`, `listoEn` cleared, order reappears in the pending list) in `backend/tests/integration/reapertura-pedido.test.js`
- [X] T016 [P] [US1] Component test for the kitchen mark/undo flow, the accessible ready distinction (colour + symbol/text) and the offline state (indicator and blocked marking) in `frontend/tests/pages/CocinaPage.test.jsx`
- [X] T017 [P] [US1] Component test for the «Pedido completado» notice and its ≥10 s «Deshacer» window (fake timers) in `frontend/tests/components/AvisoPedidoCompletado.test.jsx`

### Implementation for User Story 1

- [X] T018 [P] [US1] Implement `pedido` and `lineaPedido` data-access and queries (kitchen pending list) in `backend/src/models/pedido.js` and `backend/src/models/lineaPedido.js`
- [X] T019 [US1] Implement mark/undo service with rules (own partida, pending order, line-level mark, order completion) in `backend/src/services/marcarListo.js`
- [X] T020 [US1] Allow undoing the last line when the order is no longer pending: clear `listoEn` and recalculate the derived order state in `backend/src/services/marcarListo.js`
- [X] T021 [US1] Implement `PUT /pedidos/{pedidoId}/lineas/{lineaId}/estado` and register routes in `backend/src/routes/pedidos.js` and `backend/src/app.js`
- [ ] T022 [US1] Implement `GET /partidas/{partidaId}/pedidos-pendientes` in `backend/src/routes/partidas.js` and register it in `backend/src/app.js`
- [ ] T023 [P] [US1] Build kitchen page and components (`PedidoCard`, `LineaPlato`) with accessible ready marking (colour + «listo» text/symbol and `aria-label`) in `frontend/src/pages/CocinaPage.jsx`, `frontend/src/components/PedidoCard.jsx`, `frontend/src/components/LineaPlato.jsx`
- [X] T024 [US1] Wire mark/undo actions, disallowed-action feedback (403/409) and the offline state (indicator «sin conexión», blocked marking and on-screen data preserved) in `frontend/src/pages/CocinaPage.jsx`, `frontend/src/components/IndicadorConexion.jsx` and `frontend/src/services/api.js`
- [X] T025 [US1] Build the «Pedido completado» toast/notice with a «Deshacer» action and a minimum 10 s timer in `frontend/src/components/AvisoPedidoCompletado.jsx`
- [X] T026 [US1] Wire the notice: keep the last `pedidoId`/`lineaId`, call the undo operation and make the reordered order reappear in the kitchen list in `frontend/src/pages/CocinaPage.jsx` and `frontend/src/services/api.js`

**Checkpoint**: US1 funcional y probable de forma independiente

---

## Phase 4: User Story 2 - Reflejo inmediato en la pantalla del camarero (Priority: P2)

**Goal**: la marca de «listo» se refleja en las pantallas de los camareros que atienden la mesa,
sin recargar; la reapertura de un pedido completado se propaga igualmente.

**Independent Test**: con la pantalla de sala de una mesa abierta, marcar un plato en cocina y
comprobar que sala lo muestra como listo sin recargar.

### Tests for User Story 2 ⚠️

- [X] T027 [P] [US2] Contract test for `GET /mesas/{mesaId}/estado-platos` and the SSE event shape in `backend/tests/contract/estado-sala.test.js`
- [X] T028 [P] [US2] Integration test for the mark→sala reflection in `backend/tests/integration/reflejo-sala.test.js`
- [ ] T029 [P] [US2] Integration test for `linea.actualizada` and `pedido.reabierto` events emitted when undoing the last line of a completed order in `backend/tests/integration/eventos-reapertura.test.js`
- [ ] T030 [P] [US2] Component test for the waiter view in `frontend/tests/pages/SalaPage.test.jsx`

### Implementation for User Story 2

- [ ] T031 [US2] Implement SSE channel and event emission (`linea.actualizada`, `pedido.pendientes-cambiado`) in `backend/src/realtime/sse.js` and `backend/src/realtime/emit.js`
- [ ] T032 [US2] Emit `linea.actualizada` and `pedido.reabierto` when undoing the last line of a completed order in `backend/src/realtime/emit.js` and `backend/src/services/marcarListo.js`
- [ ] T033 [US2] Implement `GET /mesas/{mesaId}/estado-platos` in `backend/src/routes/mesas.js` and register it in `backend/src/app.js`
- [ ] T034 [P] [US2] Build waiter page showing plate states in `frontend/src/pages/SalaPage.jsx`
- [ ] T035 [US2] Subscribe the frontend to SSE and update state without reload in `frontend/src/services/events.js` and `frontend/src/state/useEstadoPlatos.js`

**Checkpoint**: US1 y US2 funcionan de forma independiente

---

## Phase 5: User Story 3 - Registrar el momento de preparación (Priority: P3)

**Goal**: el sistema guarda el momento en que cada plato se marcó como listo; re-marcar no cambia
el momento y deshacer lo descarta.

**Independent Test**: marcar varios platos en momentos distintos y comprobar que cada uno conserva
su momento; re-marcar uno ya listo no lo altera.

### Tests for User Story 3 ⚠️

- [ ] T036 [P] [US3] Unit test for `listoEn` semantics (set once, unchanged on re-mark, cleared on undo) in `backend/tests/unit/momento-listo.test.js`
- [ ] T037 [P] [US3] Contract test asserting `listoEn` appears in API responses in `backend/tests/contract/listo-en.test.js`

### Implementation for User Story 3

- [ ] T038 [US3] Extend the mark/undo service to record `listoEn` on mark and clear it on undo in `backend/src/services/marcarListo.js`
- [ ] T039 [US3] Expose `listoEn` in API responses in `backend/src/models/lineaPedido.js` and `backend/src/routes/pedidos.js`
- [ ] T040 [US3] Show the preparation moment in the plate component in `frontend/src/components/LineaPlato.jsx`

**Checkpoint**: las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: mejoras que afectan a varias historias

- [ ] T041 [P] Add logging for mark/undo operations in `backend/src/config/logger.js` and `backend/src/services/marcarListo.js`
- [ ] T042 [P] Document docker-compose usage and project setup in `README.md`
- [ ] T043 [P] Add integration test for order completion/disappearance in `backend/tests/integration/pedido-completado.test.js`
- [ ] T044 Run the validation guide in `specs/004-marcar_listos/quickstart.md` end-to-end and fix gaps found
- [ ] T045 Run the «Deshacer tras completar el pedido» scenario (12) in `specs/004-marcar_listos/quickstart.md` end-to-end and fix gaps found in `frontend/src/components/AvisoPedidoCompletado.jsx` and `backend/src/services/marcarListo.js`
- [ ] T046 Verify full test suites pass and map results to FR-001…FR-016 in `backend/tests/` and `frontend/tests/`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende del Setup; BLOQUEA todas las historias
- **User Stories (Phase 3+)**: dependen de la fase Foundational
  - US1 (P1) primero; US2 (P2) y US3 (P3) después, en orden de prioridad o en paralelo con equipo
- **Polish (Phase 6)**: depende de las historias que se vayan a entregar

### User Story Dependencies

- **US1 (P1)**: arranca tras Foundational; sin dependencias de otras historias (incluye el aviso
  «Pedido completado» con «Deshacer»)
- **US2 (P2)**: tras Foundational; reutiliza la marca de US1 pero es probable por separado. La
  emisión de `pedido.reabierto` (T032) depende de la reversión de la última línea (T020) y del
  canal SSE (T031)
- **US3 (P3)**: tras US1 (extiende su servicio); probable por separado

### Within Each User Story

- Pruebas primero (deben fallar), luego modelos, servicios, endpoints y UI
- US1 antes de US3 (US3 extiende el servicio de US1)
- En US1, el aviso «Pedido completado» (T025–T026) se construye sobre el flujo de marcado (T023–T024)
- Terminar una historia antes de pasar a la siguiente prioridad

### Parallel Opportunities

- Tareas [P] de Setup (T002–T006) en paralelo
- Tareas [P] de Foundational (T008–T011) en paralelo
- Dentro de cada historia, las pruebas [P] corren en paralelo (US1: T012–T017; US2: T027–T030;
  US3: T036–T037)
- Con equipo: un desarrollador por historia (US1, US2, US3) tras Foundational

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 en paralelo:
Task: "Contract test for PUT /pedidos/{pedidoId}/lineas/{lineaId}/estado in backend/tests/contract/marcar-estado.test.js"
Task: "Unit test for mark/undo service in backend/tests/unit/marcar-listo-service.test.js"
Task: "Contract test for undoing the last line of a completed order in backend/tests/contract/desmarcar-completado.test.js"
Task: "Integration test for reopening after undo of the last line in backend/tests/integration/reapertura-pedido.test.js"
Task: "Component test for the kitchen mark/undo flow in frontend/tests/pages/CocinaPage.test.jsx"
Task: "Component test for the «Pedido completado» notice and its ≥10 s window in frontend/tests/components/AvisoPedidoCompletado.test.jsx"

# Modelos y UI de US1 en paralelo:
Task: "Implement pedido and lineaPedido data-access in backend/src/models/pedido.js and backend/src/models/lineaPedido.js"
Task: "Build kitchen page and components in frontend/src/pages/CocinaPage.jsx, frontend/src/components/PedidoCard.jsx, frontend/src/components/LineaPlato.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (crítica)
3. Completar Phase 3: US1, incluido el aviso «Pedido completado» con «Deshacer»
4. **PARAR y VALIDAR** US1 de forma independiente
5. Demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. US1 → probar → demostrar (MVP)
3. US2 → probar → demostrar (reflejo en sala y reapertura propagada)
4. US3 → probar → demostrar (registro del momento)
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
