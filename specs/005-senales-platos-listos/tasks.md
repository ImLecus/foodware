# Tasks: Señales de platos listos por mesa

**Input**: Design documents from `/specs/005-senales-platos-listos/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: La constitución de Foodware exige pruebas automatizadas junto a cada funcionalidad ("sin pruebas, la funcionalidad no está completa"), por lo que **sí** se generan tareas de prueba.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece la tarea (US1, US2, US3)
- Cada descripción incluye la ruta exacta del fichero

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/` (según `plan.md`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto y estructura básica

- [ ] T001 Crear la estructura de carpetas del proyecto (`backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`) según `plan.md`
- [ ] T002 Inicializar el proyecto backend (ExpressJS, `pg`, `dotenv`, `cors`) en `backend/package.json`
- [ ] T003 [P] Inicializar el proyecto frontend (Vite + React + Chakra UI) en `frontend/package.json`
- [ ] T004 [P] Configurar ESLint y Prettier en `backend/` y `frontend/`
- [ ] T005 [P] Configurar Jest + Supertest (backend) y Vitest + React Testing Library (frontend) en sus respectivos `package.json`
- [ ] T006 [P] Añadir `docker-compose.yml` (frontend, backend, PostgreSQL), `backend/Dockerfile` y `frontend/Dockerfile`
- [ ] T007 [P] Añadir `backend/.env.example` con las variables de conexión (sin secretos) y la sección de arranque en `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura común que MUST estar lista antes de empezar cualquier historia

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase

- [ ] T008 Implementar el pool de conexión a PostgreSQL en `backend/src/db.js`
- [ ] T009 Crear la migración base (`mesas`, `platos_comanda`, `avisos_mesa`) en `backend/src/migrations/0001_init.sql`
- [ ] T010 [P] Crear el script de datos de ejemplo (mesas abiertas y platos) en `backend/scripts/seed.js`
- [ ] T011 Implementar el bootstrap de la app Express y del servidor HTTP en `backend/src/app.js` y `backend/src/server.js`
- [ ] T012 [P] Implementar el hub SSE (registro de clientes, difusión y *heartbeat*) en `backend/src/realtime/eventos.js`
- [ ] T013 [P] Implementar el middleware de manejo de errores en `backend/src/middleware/errores.js`
- [ ] T014 Añadir el arnés de pruebas del backend (factoría de app y base de datos de test) en `backend/tests/helpers/`

**Checkpoint**: Infraestructura lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Estado de los platos de cada mesa en tiempo real (Priority: P1) 🎯 MVP

**Goal**: El camarero ve todas las mesas abiertas con el estado (pendiente/listo) de cada plato, actualizado en vivo, con distinción visual, estados vacío/carga e indicador de "sin conexión".

**Independent Test**: Abrir una mesa con platos en distinto estado, comprobar que el camarero ve el estado de cada plato y que cambia solo al marcarse un plato como listo en cocina, sin recargar.

### Tests for User Story 1 ⚠️

> **NOTE: Escribir estas pruebas PRIMERO y comprobar que fallan antes de implementar**

- [ ] T015 [P] [US1] Test de contrato de `GET /api/sala/mesas` en `backend/tests/contract/sala-mesas.test.js`
- [ ] T016 [P] [US1] Test unitario de `mesasService` (solo mesas abiertas, agrupación por partida, lista vacía) en `backend/tests/unit/mesasService.test.js`
- [ ] T017 [P] [US1] Test de componente de la vista de sala (distinción listo/pendiente, estados vacío y carga) en `frontend/tests/components/SalaCamarero.test.jsx`

### Implementation for User Story 1

- [ ] T018 [US1] Implementar `mesasService` (lectura de mesas abiertas con platos y estado) en `backend/src/services/mesasService.js`
- [ ] T019 [US1] Implementar `GET /api/sala/mesas` en `backend/src/routes/sala.js`
- [ ] T020 [US1] Implementar la actualización de estado de un plato y la difusión del evento `plato-estado` (costura de integración con la historia 04) en `backend/src/routes/platos.js` y `backend/src/services/platosService.js`
- [ ] T021 [P] [US1] Implementar el cliente HTTP (`fetch`) en `frontend/src/services/api.js`
- [ ] T022 [P] [US1] Implementar el envoltorio de `EventSource` con reconexión en `frontend/src/services/live.js`
- [ ] T023 [US1] Implementar el hook `useSala` (instantánea + SSE + reconexión + estado sin conexión) en `frontend/src/hooks/useSala.js`
- [ ] T024 [P] [US1] Implementar el componente `PlatoEstado` (indicador pendiente/listo) en `frontend/src/components/PlatoEstado.jsx`
- [ ] T025 [P] [US1] Implementar el componente `MesaCard` (mesa con sus platos agrupados por partida) en `frontend/src/components/MesaCard.jsx`
- [ ] T026 [P] [US1] Implementar el componente `SinConexion` (indicador de "sin conexión") en `frontend/src/components/SinConexion.jsx`
- [ ] T027 [US1] Implementar la página `SalaCamarero` (estado vacío, carga, lista de mesas, sin conexión) en `frontend/src/pages/SalaCamarero.jsx`
- [ ] T028 [US1] Cablear la app y el enrutado en `frontend/src/App.jsx` y `frontend/src/main.jsx`
- [ ] T029 [US1] Test de integración de US1 (marcar listo en cocina → reflejo en sala sin recargar) en `backend/tests/integration/sala-vivo.test.js`

**Checkpoint**: User Story 1 totalmente funcional y probable por separado

---

## Phase 4: User Story 2 - Aviso de mesa completa (Priority: P2)

**Goal**: Cuando todos los platos de una mesa están listos, el sistema emite un aviso visual (y sonoro opcional) asociado a esa mesa, perceptible y persistente; si un plato vuelve a pendiente, el aviso se retira.

**Independent Test**: Completar todos los platos de una mesa y comprobar que aparece una señal asociada a esa mesa, perceptible y que no se repite sola.

### Tests for User Story 2 ⚠️

- [ ] T030 [P] [US2] Test unitario de `avisosService` (completitud, creación, retirada al revertir, mesa sin platos) en `backend/tests/unit/avisosService.test.js`
- [ ] T031 [P] [US2] Test de contrato de los eventos SSE `aviso-activo` y `aviso-retirado` en `backend/tests/contract/avisos-eventos.test.js`
- [ ] T032 [P] [US2] Test de componente de `AvisoMesa` (señal visual persistente, identifica la mesa, sonido una sola vez) en `frontend/tests/components/AvisoMesa.test.jsx`

### Implementation for User Story 2

- [ ] T033 [US2] Implementar `avisosService` (cálculo de completitud y ciclo de vida del aviso) en `backend/src/services/avisosService.js`
- [ ] T034 [US2] Integrar la creación/retirada del aviso en el gestor de cambio de estado y difundir `aviso-activo`/`aviso-retirado` en `backend/src/routes/platos.js`
- [ ] T035 [US2] Incluir el aviso vigente en la respuesta de `GET /api/sala/mesas` en `backend/src/services/mesasService.js`
- [ ] T036 [P] [US2] Implementar el componente `AvisoMesa` (señal visual destacada + sonido opcional una sola vez) en `frontend/src/components/AvisoMesa.jsx`
- [ ] T037 [US2] Gestionar los eventos SSE de aviso en `useSala` en `frontend/src/hooks/useSala.js`
- [ ] T038 [US2] Renderizar el aviso en la vista de sala en `frontend/src/pages/SalaCamarero.jsx`

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente

---

## Phase 5: User Story 3 - Descartar el aviso de una mesa atendida (Priority: P3)

**Goal**: El camarero descarta el aviso de una mesa atendida con una sola acción; el aviso deja de mostrarse y no se repite hasta un nuevo plato listo, sincronizándose entre pantallas.

**Independent Test**: Generar un aviso, descartarlo y comprobar que deja de mostrarse y de repetirse; tras un nuevo plato listo, vuelve a generarse.

### Tests for User Story 3 ⚠️

- [ ] T039 [P] [US3] Test de contrato de `POST /api/sala/avisos/:id/descartar` (200, idempotente, 404) en `backend/tests/contract/avisos-descartar.test.js`
- [ ] T040 [P] [US3] Test de integración de descarte y regeneración del aviso en `backend/tests/integration/aviso-descarte.test.js`
- [ ] T041 [P] [US3] Test de componente de la acción de descartar (una sola acción; deshabilitada sin conexión) en `frontend/tests/components/DescartarAviso.test.jsx`

### Implementation for User Story 3

- [ ] T042 [US3] Implementar la lógica de descarte del aviso (idempotente) en `backend/src/services/avisosService.js`
- [ ] T043 [US3] Implementar `POST /api/sala/avisos/:id/descartar` en `backend/src/routes/avisos.js`
- [ ] T044 [US3] Difundir el evento `aviso-descartado` al descartar en `backend/src/routes/avisos.js`
- [ ] T045 [US3] Añadir la acción de descartar en `frontend/src/components/AvisoMesa.jsx`
- [ ] T046 [US3] Gestionar el evento SSE `aviso-descartado` en `useSala` en `frontend/src/hooks/useSala.js`

**Checkpoint**: Las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias

- [ ] T047 [P] Actualizar la documentación de puesta en marcha y de la funcionalidad en `README.md`
- [ ] T048 [P] Revisar que todos los textos visibles están en español de España en `frontend/src/`
- [ ] T049 Revisar la coherencia del comportamiento sin conexión y la resincronización en `frontend/src/hooks/useSala.js` y `backend/src/realtime/eventos.js`
- [ ] T050 [P] Verificar que `.gitignore` excluye `.env` y que no hay secretos en el repositorio (`.gitignore`)
- [ ] T051 Verificar la reproducibilidad de Docker con `docker compose up --build` (`docker-compose.yml`)
- [ ] T052 Ejecutar los escenarios de validación A–G de `specs/005-senales-platos-listos/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Setup; BLOQUEA todas las historias
- **User Stories (Phase 3+)**: Dependen de Foundational
  - Pueden ir en paralelo (si hay personal) o en orden de prioridad (P1 → P2 → P3)
- **Polish (Phase 6)**: Depende de las historias deseadas

### User Story Dependencies

- **US1 (P1)**: Empieza tras Foundational; sin dependencias de otras historias
- **US2 (P2)**: Empieza tras Foundational; reutiliza la costura de cambio de estado de US1 (T020) para detectar la completitud, pero es probable por separado
- **US3 (P3)**: Empieza tras Foundational; reutiliza el aviso creado por US2, pero es probable por separado

### Within Each User Story

- Las pruebas se escriben y FALLAN antes de implementar
- Servicios antes que rutas
- Backend antes que su integración en el frontend
- Implementación base antes de la integración entre historias

### Parallel Opportunities

- Todas las tareas [P] de Setup pueden ir en paralelo
- Todas las tareas [P] de Foundational pueden ir en paralelo
- Tras Foundational, US1, US2 y US3 pueden abordarse en paralelo por distintas personas
- Dentro de cada historia, las pruebas [P] y los componentes [P] pueden ir en paralelo

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 en paralelo:
Task: "Test de contrato de GET /api/sala/mesas en backend/tests/contract/sala-mesas.test.js"
Task: "Test unitario de mesasService en backend/tests/unit/mesasService.test.js"
Task: "Test de componente de la vista de sala en frontend/tests/components/SalaCamarero.test.jsx"

# Componentes de US1 en paralelo:
Task: "Implementar PlatoEstado en frontend/src/components/PlatoEstado.jsx"
Task: "Implementar MesaCard en frontend/src/components/MesaCard.jsx"
Task: "Implementar SinConexion en frontend/src/components/SinConexion.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO)
3. Completar Fase 3: User Story 1
4. **PARAR Y VALIDAR**: probar US1 de forma independiente
5. Desplegar/demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. Añadir US1 → probar → demostrar (MVP)
3. Añadir US2 → probar → demostrar
4. Añadir US3 → probar → demostrar
5. Cada historia añade valor sin romper las anteriores

### Parallel Team Strategy

1. El equipo completa Setup + Foundational
2. Tras Foundational:
   - Persona A: US1
   - Persona B: US2
   - Persona C: US3
3. Las historias se integran de forma independiente

---

## Notes

- [P] = ficheros distintos, sin dependencias
- [Story] mapea cada tarea a su historia para trazabilidad
- Verificar que cada prueba falla antes de implementar
- **Parada por tarea (constitución)**: al implementar con `/speckit.implement`, el agente MUST detenerse tras cada tarea, resumir lo hecho y esperar la revisión y el commit del usuario antes de continuar
- Commits en formato Conventional Commits (p. ej. `feat(005): ...`)
- Commit tras cada tarea o grupo lógico
