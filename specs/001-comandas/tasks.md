---
description: "Task list for feature 001-comandas"
---

# Tasks: Abrir mesa y tomar pedido

**Input**: Design documents from `/specs/001-comandas/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: INCLUIDAS — la constitución del proyecto exige pruebas automatizadas para toda
funcionalidad. Se escriben junto al desarrollo y deben fallar antes de implementar.

**Organization**: Una sola historia de usuario (US1, P1). Fases: Setup → Foundational → US1 → Polish.

**Flujo de trabajo**: Cada tarea completada se **detiene** para que el usuario la revise y haga su
commit (constitución: parada por tarea; Conventional Commits). Tareas `[P]` son paralelizables
(ficheros distintos, sin dependencias), pero se confirman igualmente una a una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias pendientes)
- **[Story]**: `[US1]` en las tareas de la historia de usuario
- Todas las tareas incluyen rutas de fichero exactas

## Path Conventions

Aplicación web (ver `plan.md`): `backend/` y `frontend/` en la raíz del repositorio, más
`docker-compose.yml`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto y estructura básica.

- [ ] T001 Crear la estructura del monorepo (`backend/`, `frontend/`) y los ficheros de raíz `.gitignore`, `.env.example` y `README.md`
- [ ] T002 Inicializar el backend Node.js 20 + JavaScript + Express en `backend/` (`backend/package.json`, `backend/jsconfig.json`)
- [ ] T003 Inicializar el frontend Vite + React 18 + JavaScript + Chakra UI en `frontend/` (`frontend/package.json`, `frontend/jsconfig.json`, `frontend/vite.config.js`)
- [ ] T004 [P] Configurar ESLint y Prettier en `backend/.eslintrc.cjs` y `frontend/.eslintrc.cjs`
- [ ] T005 [P] Configurar Vitest en `backend/vitest.config.js` y `frontend/vitest.config.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura base que debe estar lista antes de implementar la historia.

**⚠️ CRITICAL**: Ninguna tarea de la historia US1 puede empezar hasta completar esta fase.

- [ ] T006 Crear `docker-compose.yml` (servicios `backend` y `frontend`; SQLite persistido en volumen) y `backend/Dockerfile` y `frontend/Dockerfile`
- [ ] T007 Configurar variables de entorno del backend en `backend/src/config.js` y documentar `.env.example`
- [ ] T008 Implementar la conexión a SQLite en `backend/src/db/db.js`
- [ ] T009 Crear las migraciones SQL del esquema (partida, plato, mesa, pedido, linea_pedido) en `backend/migrations/`
- [ ] T010 Implementar el script de datos de ejemplo (mesas y carta) en `backend/src/db/seed.js`
- [ ] T011 Montar el esqueleto de la app Express con router base, middleware de errores y hub SSE compartido (`backend/src/realtime/hub.js`) en `backend/src/app.js` y `backend/src/index.js`
- [ ] T012 Implementar el endpoint de salud `GET /api/health` en `backend/src/api/health.js` con su prueba en `backend/tests/health.test.js`
- [ ] T013 Implementar el middleware de identidad del camarero (sesión existente) en `backend/src/api/middleware/camarero.js`

**Checkpoint**: Base lista — puede comenzar la historia US1.

---

## Phase 3: User Story 1 - Abrir una mesa y tomar el pedido plato a plato (Priority: P1) 🎯 MVP

**Goal**: El camarero abre una mesa, añade platos con cantidad que se agrupan por partidas, ajusta
y confirma el pedido, que queda enviado y vinculada a la mesa con el pedido agrupado por partidas.

**Independent Test**: abrir una mesa, añadir platos de las tres partidas, ajustar cantidades,
confirmar y comprobar que el pedido queda enviado, vinculada a la mesa y agrupado por partidas
(ver `quickstart.md`, escenarios 1–9).

### Tests for User Story 1 (write first, ensure they FAIL) ⚠️

- [ ] T014 [P] [US1] Prueba de API para abrir mesa e iniciar pedido (incluye 409 si ya hay pedido en curso) en `backend/tests/pedidos.abrir.test.js`
- [ ] T015 [P] [US1] Prueba de API para añadir, modificar y retirar líneas, y para el precio fijado al pedir, en `backend/tests/pedidos.lineas.test.js`
- [ ] T016 [P] [US1] Prueba de API para confirmar el pedido (pedido agrupado por partidas) y para impedir confirmar un pedido vacío, en `backend/tests/pedidos.confirmar.test.js`
- [ ] T017 [P] [US1] Pruebas de componentes de sala (agrupar por partidas, añadir y ajustar líneas) en `frontend/tests/pedido.test.jsx`

### Implementation for User Story 1

- [ ] T018 [P] [US1] Repositorio de mesas (listar, marcar ocupada) en `backend/src/db/mesas.js`
- [ ] T019 [P] [US1] Repositorio de platos (carta vigente, disponibles) en `backend/src/db/platos.js`
- [ ] T020 [P] [US1] Repositorio de pedidos y líneas (crear, añadir, modificar, retirar, confirmar) en `backend/src/db/pedidos.js`
- [ ] T021 [US1] Dominio de pedidos: agrupación por partidas y reglas (un pedido en curso por mesa, pedido no vacía) en `backend/src/domain/pedidos.js`
- [ ] T022 [US1] Esquemas de validación zod para las peticiones en `backend/src/schemas/pedidos.js`
- [ ] T023 [US1] Endpoints de mesas `GET /api/mesas` y `POST /api/mesas/{mesaId}/abrir` en `backend/src/api/mesas.js`
- [ ] T024 [US1] Endpoint de carta `GET /api/platos` en `backend/src/api/platos.js`
- [ ] T025 [US1] Endpoints de pedido `GET /api/pedidos/{id}`, `POST/PATCH/DELETE` de líneas y `POST /confirmar` en `backend/src/api/pedidos.js`
- [ ] T026 [US1] Fijar el precio del plato en la línea al pedirla (FR-018) en `backend/src/db/pedidos.js`
- [ ] T027 [P] [US1] Pantalla de mesas (listar y abrir) en `frontend/src/pages/Mesas.jsx`
- [ ] T028 [P] [US1] Componente de pedido agrupada por partidas en `frontend/src/components/Pedido.jsx`
- [ ] T029 [US1] Selector de platos de la carta con cantidad en `frontend/src/components/SelectorPlatos.jsx`
- [ ] T030 [US1] Acciones de ajustar cantidad, retirar línea y confirmar pedido en `frontend/src/components/Pedido.jsx`
- [ ] T031 [US1] Cliente HTTP de la API, suscripción SSE (`frontend/src/services/realtime.js`) y estado "sin conexión" (bloquear confirmar/modificar y conservar lo escrito) en `frontend/src/services/api.js` y `frontend/src/components/Conexion.jsx`
- [ ] T032 [US1] Localización es-ES y formato de moneda en euros en `frontend/src/theme/` y `frontend/src/utils/formato.js`

**Checkpoint**: US1 funcional y verificable de forma independiente (MVP).

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras y validación final.

- [ ] T033 [P] Documentar arranque, pruebas y validación manual en `README.md` (enlazando `specs/001-comandas/quickstart.md`)
- [ ] T034 Ejecutar la validación manual de `specs/001-comandas/quickstart.md` (escenarios 1–9) y corregir lo necesario
- [ ] T035 [P] Revisar todos los textos visibles en español de España y el formato de moneda en la UI
- [ ] T036 Ejecutar la suite completa (`docker compose run --rm backend npm test` y `frontend npm test`) y dejar todo en verde

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias; empieza de inmediato.
- **Foundational (Phase 2)**: depende de Setup; BLOQUEA la historia US1.
- **User Story 1 (Phase 3)**: depende de Foundational.
- **Polish (Phase 4)**: depende de US1 completa.

### Within User Story 1

- Las pruebas (T014–T017) se escriben primero y deben fallar antes de implementar.
- Repositorios (T018–T020) antes del dominio (T021) y de los endpoints (T023–T025).
- T026 depende de T020.
- Frontend (T027–T032) puede avanzar en paralelo al backend una vez definido el contrato (`contracts/openapi.yaml`).

### Parallel Opportunities

- T004 y T005 en paralelo (ficheros distintos).
- T014–T017 en paralelo (ficheros de prueba distintos).
- T018–T020 en paralelo (repositorios distintos).
- T027, T028 y T033, T035 en paralelo.

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 (escribir primero, deben fallar):
Task: "T014 [US1] Prueba de API abrir mesa en backend/tests/pedidos.abrir.test.js"
Task: "T015 [US1] Prueba de API líneas y precio en backend/tests/pedidos.lineas.test.js"
Task: "T016 [US1] Prueba de API confirmar y pedido vacío en backend/tests/pedidos.confirmar.test.js"
Task: "T017 [US1] Pruebas de componentes en frontend/tests/pedido.test.jsx"

# Repositorios de US1 (paralelizables):
Task: "T018 [US1] Repositorio de mesas en backend/src/db/mesas.js"
Task: "T019 [US1] Repositorio de platos en backend/src/db/platos.js"
Task: "T020 [US1] Repositorio de pedidos en backend/src/db/pedidos.js"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1 (Setup).
2. Completar Phase 2 (Foundational).
3. Completar Phase 3 (US1).
4. **PARAR y VALIDAR**: probar US1 con `quickstart.md` antes de seguir.
5. Desplegar/demostrar si procede.

### Incremental Delivery

1. Setup + Foundational → base lista.
2. US1 → probar de forma independiente → demo (MVP).
3. Polish → validación final.

### Parada por tarea (constitución)

Tras completar cada tarea, el agente se detiene, resume lo hecho y espera a que el usuario la
revise y haga el commit (Conventional Commits) antes de continuar con la siguiente.

---

## Notes

- `[P]` = ficheros distintos, sin dependencias.
- Las pruebas se escriben primero y deben fallar antes de implementar.
- Un commit por tarea (Conventional Commits).
- La edición de pedidos ya enviados pertenece a la historia 002 (no se incluye aquí).
- Fuera de alcance: cocina (003), marcar listos (004), señales (005), cierre de cuenta (006),
  dashboard (007) y gestión de carta (008).
