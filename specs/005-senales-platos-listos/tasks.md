# Tasks: Señales de platos listos por mesa

**Input**: Design documents from `/specs/005-senales-platos-listos/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: La constitución de Foodware exige pruebas automatizadas junto a cada funcionalidad ("sin pruebas, la funcionalidad no está completa"), por lo que **sí** se generan tareas de prueba.

**Clarificaciones integradas (sesión 2026-10-20/21)**: (a) la vista muestra **todas las mesas abiertas** (comanda en curso o enviada, cuenta no cerrada) — T012/T013/T018/T019; (b) al **editar una comanda ya enviada** se recalcula la completitud y se retira/regenera el aviso, y el recálculo se dispara al **confirmar los cambios** (`POST /api/pedidos/:pedidoId/enviar-cambios`) — T033/T041/T042/T047; (c) al **cerrarse la cuenta** de una mesa con aviso activo, el aviso se retira y desaparece de todas las pantallas — T018/T055/T057.

**Convención de nombres (coherencia con el repositorio, ver `plan.md`/`contracts/api.md`)**: los eventos SSE usan `punto.minuscula` (`linea.actualizada`, `aviso.activo`, `aviso.retirado`, `aviso.descartado`, como `pedido.nuevo`/`pedido.modificado` ya existentes en `backend/src/realtime/emit.js`); las claves JSON de cuerpos y respuestas usan `snake_case` (`mesa_id`, `plato_id`, `aviso_id`, `generado_en`, `descartado_en`, `marcado_en`).

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

> El esqueleto base (ExpressJS + SQLite + React/Vite, lint, Docker, migraciones y arnés de pruebas) **ya está implementado** por las historias 001–003. Las tareas T001–T005 se limitan a **verificar** esa base y no añaden dependencias nuevas.

- [x] T001 Verificar la estructura de carpetas del proyecto (`backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`) según `plan.md`
- [x] T002 [P] Verificar el proyecto backend (ExpressJS, `better-sqlite3`, `cors`, `zod`) en `backend/package.json`
- [x] T003 [P] Verificar el proyecto frontend (Vite + React + Chakra UI) en `frontend/package.json`
- [x] T004 [P] Verificar la configuración de lint y formato en `backend/` y `frontend/`
- [x] T005 [P] Verificar Vitest + Supertest (backend) y Vitest + React Testing Library (frontend) en sus respectivos `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura común que MUST estar lista antes de empezar cualquier historia

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase

> Esta base ya existe. La 005 **no necesita migración nueva**: el esquema compartido `backend/migrations/001_init.sql` ya define `mesas`, `pedidos`, `lineas_pedido` (`estado`, `listo_en`) y la tabla `avisos`.

- [x] T006 [P] Verificar la conexión a SQLite y el runner de migraciones en `backend/src/db/index.js`
- [x] T007 Verificar que el esquema base (`mesas`, `lineas_pedido` con `estado`/`listo_en`, `avisos`) existe en `backend/migrations/001_init.sql`
- [x] T008 [P] Verificar el arranque de la app Express y del servidor HTTP en `backend/src/app.js` y `backend/src/server.js`
- [x] T009 [P] Verificar el hub SSE compartido (registro de clientes, difusión y *heartbeat*) en `backend/src/realtime/hub.js`
- [x] T010 [P] Verificar el middleware de manejo de errores en `backend/src/middleware/error.js`
- [x] T011 Verificar el arnés de pruebas del backend (factoría de app, base de datos en memoria y cliente SSE falso) en `backend/tests/ayuda.js`

**Checkpoint**: Infraestructura lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Estado de los platos de cada mesa en tiempo real (Priority: P1) 🎯 MVP

**Goal**: El camarero ve todas las mesas abiertas (comanda en curso o enviada, cuenta no cerrada) con el estado (pendiente/listo) de los platos ya enviados a cocina, actualizado en vivo, con distinción visual, estados vacío/carga e indicador de "sin conexión".

**Independent Test**: Abrir una mesa con platos (enviados) en distinto estado, comprobar que el camarero ve el estado de cada plato y que cambia solo al marcarse un plato como listo, sin recargar.

### Tests for User Story 1 ⚠️

> **NOTE: Escribir estas pruebas PRIMERO y comprobar que fallan antes de implementar**

- [x] T012 [P] [US1] Test de contrato de `GET /api/sala/mesas` (solo mesas abiertas —en curso o enviadas— y solo líneas enviadas; mesa con comanda en curso aparece con `platos` vacío, `completa` falso y `aviso` nulo; agrupación por partida; lista vacía) en `backend/tests/contract/sala-mesas.test.js`
- [x] T013 [P] [US1] Test unitario de la instantánea de sala (completitud, mesa sin líneas enviadas, mesa con comanda en curso, lista vacía) en `backend/tests/unit/salaMesas.test.js`
- [x] T014 [P] [US1] Test de contrato de `PUT /api/pedidos/{pedidoId}/lineas/{lineaId}/estado` (200 marcar/deshacer, idempotencia, 400 valor inválido, 409 pedido no enviado, 404) en `backend/tests/contract/estado-linea.test.js`
- [x] T015 [P] [US1] Test unitario del marcado de línea (marca/deshace, fija `listo_en`, solo pedidos enviados) en `backend/tests/unit/estadoLinea.test.js`
- [x] T016 [P] [US1] Test de componente de la vista de sala (distinción listo/pendiente, estados vacío y carga) en `frontend/tests/components/SalaEstado.test.jsx`
- [x] T017 [P] [US1] Test del hook `useSala` (instantánea + SSE + estado sin conexión) en `frontend/tests/hooks/useSala.test.jsx`

### Implementation for User Story 1

- [x] T018 [US1] Implementar el acceso a mesas abiertas en `backend/src/db/mesas.js`: reunir por mesa el pedido **enviado** (cuyas líneas se muestran) y detectar si además hay un pedido **en curso** (`en_curso` ⇒ mesa sin platos marcables); incluir las mesas ocupadas mientras su cuenta no se haya cerrado
- [x] T019 [US1] Implementar el servicio de instantánea de sala (mesas abiertas, platos por partida, `completa`; mesa en curso con `platos` vacío, `completa` falso y `aviso` nulo; si la mesa deja de estar abierta por cierre de cuenta desaparece de la lista y su aviso no se muestra) en `backend/src/services/salaMesas.js`
- [x] T020 [US1] Implementar el servicio de marcado/deshace de línea y la difusión del evento `linea.actualizada` (reutilizando el emisor existente de `backend/src/realtime/emit.js`) en `backend/src/services/estadoLinea.js` y `backend/src/realtime/emit.js`
- [x] T021 [US1] Implementar el esquema de validación de la entrada de estado con `zod` en `backend/src/schemas/estadoLinea.js`
- [x] T022 [US1] Implementar `GET /api/sala/mesas` en `backend/src/routes/sala.js`
- [x] T023 [US1] Implementar `PUT /api/pedidos/{pedidoId}/lineas/{lineaId}/estado` en `backend/src/routes/lineas.js` y montarlo en `backend/src/app.js`
- [x] T024 [P] [US1] Implementar el cliente HTTP de sala (fetch) en `frontend/src/services/api.js`
- [x] T025 [P] [US1] Añadir el canal SSE de sala al envoltorio existente en `frontend/src/services/realtime.js`
- [x] T026 [US1] Implementar el hook `useSala` (instantánea + SSE + reconexión + estado sin conexión) en `frontend/src/hooks/useSala.js`
- [x] T027 [P] [US1] Implementar el componente `PlatoEstado` (indicador pendiente/listo) en `frontend/src/components/PlatoEstado.jsx`
- [x] T028 [P] [US1] Implementar el componente `MesaCard` (mesa con sus platos agrupados por partida) en `frontend/src/components/MesaCard.jsx`
- [x] T029 [P] [US1] Reutilizar (o adaptar) el componente existente `AvisoSinConexion` como indicador de "sin conexión" en `frontend/src/components/AvisoSinConexion.jsx` (evitar crear un duplicado)
- [x] T030 [US1] Implementar la página `SalaEstado` reutilizando los componentes existentes `EstadoVacio` ("No hay mesas abiertas"), `EstadoCarga` (indicador de carga) y `AvisoSinConexion`, con la lista de mesas y el estado sin conexión, en `frontend/src/pages/SalaEstado.jsx`
- [x] T031 [US1] Añadir la ruta y el enlace de la vista de sala (sin sustituir la pantalla de comandas existente) en `frontend/src/App.jsx`
- [x] T032 [US1] Test de integración de US1 (marcar listo → reflejo en sala sin recargar) en `backend/tests/integration/sala-vivo.test.js`

**Checkpoint**: User Story 1 totalmente funcional y probable por separado

---

## Phase 4: User Story 2 - Aviso de mesa completa (Priority: P2)

**Goal**: Cuando todos los platos enviados de una mesa están listos, el sistema emite un aviso visual (y sonoro, activado por defecto y silenciable) asociado a esa mesa, perceptible y persistente; si un plato vuelve a pendiente —o una edición de la comanda enviada añade un plato pendiente—, el aviso se retira y se recalcula la completitud.

**Independent Test**: Completar todos los platos (enviados) de una mesa y comprobar que aparece una señal asociada a esa mesa, perceptible, que suena una sola vez y que no se repite sola.

### Tests for User Story 2 ⚠️

- [x] T033 [P] [US2] Test unitario del ciclo de vida del aviso (completitud, creación, retirada al revertir, recálculo tras editar la comanda enviada —añadir un plato pendiente retira el aviso, los platos listos no tocados siguen listos—, mesa sin líneas enviadas, varias mesas completas a la vez) en `backend/tests/unit/avisos.test.js`
- [x] T034 [P] [US2] Test de contrato de los eventos SSE `aviso.activo` y `aviso.retirado` en `backend/tests/contract/avisos-eventos.test.js`
- [x] T035 [P] [US2] Test del control de sonido (activado por defecto, suena una vez, silencio/reactivación y persistencia) en `frontend/tests/components/AvisoMesa.sonido.test.jsx`
- [x] T036 [P] [US2] Test de componente de `AvisoMesa` (señal visual persistente, identifica la mesa) en `frontend/tests/components/AvisoMesa.test.jsx`

### Implementation for User Story 2

- [x] T037 [US2] Implementar el acceso a la tabla `avisos` (aviso vigente por mesa, alta de aviso) en `backend/src/db/avisos.js`
- [x] T038 [US2] Implementar el servicio de avisos (cálculo de completitud, creación/retirada del aviso) en `backend/src/services/avisos.js`
- [x] T039 [US2] Integrar la creación/retirada del aviso en el cambio de estado de línea y difundir `aviso.activo`/`aviso.retirado` (con la convención `punto.minuscula` de `realtime/emit.js`) en `backend/src/services/estadoLinea.js` y `backend/src/realtime/emit.js`
- [x] T040 [US2] Incluir el aviso vigente y `completa` en la instantánea de sala en `backend/src/services/salaMesas.js`
- [x] T041 [US2] Recalcular la completitud y crear/retirar el aviso al editar una comanda ya enviada (añadir, cambiar o retirar un plato), reutilizando el cálculo de T038 y difundiendo `aviso.activo`/`aviso.retirado` cuando proceda en `backend/src/services/avisos.js`
- [x] T042 [US2] Ampliar el punto de integración existente de la historia 002 `POST /api/pedidos/:pedidoId/enviar-cambios` en `backend/src/routes/pedidos.js` para recalcular la completitud de la mesa al confirmar los cambios (no en cada añadir/cambiar/retirar) y emitir `aviso.activo`/`aviso.retirado` cuando proceda, reutilizando el servicio de avisos de T038
- [x] T043 [P] [US2] Implementar la señal sonora (pitido una vez por aviso) en `frontend/src/utils/sonido.js`
- [x] T044 [US2] Implementar el componente `AvisoMesa` (señal visual destacada + control de sonido + acción de descartar) en `frontend/src/components/AvisoMesa.jsx`
- [x] T045 [US2] Gestionar los eventos SSE de aviso y la señal sonora una sola vez en `frontend/src/hooks/useSala.js`
- [x] T046 [US2] Renderizar el aviso y el control de sonido en la vista de sala en `frontend/src/pages/SalaEstado.jsx`
- [x] T047 [US2] Test de integración del recálculo tras editar una comanda enviada (añadir un plato pendiente retira el aviso y la mesa deja de estar completa; al marcarlo listo se genera un aviso nuevo) en `backend/tests/integration/sala-edicion.test.js`

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente

---

## Phase 5: User Story 3 - Descartar el aviso de una mesa atendida (Priority: P3)

**Goal**: El camarero descarta el aviso de una mesa atendida con una sola acción; el aviso deja de mostrarse en todas las pantallas y no se repite hasta un nuevo plato listo.

**Independent Test**: Generar un aviso, descartarlo y comprobar que deja de mostrarse y de repetirse; tras un nuevo plato listo, vuelve a generarse.

### Tests for User Story 3 ⚠️

- [x] T048 [P] [US3] Test de contrato de `POST /api/sala/avisos/{avisoId}/descartar` (200, idempotente, 404) en `backend/tests/contract/avisos-descartar.test.js`
- [x] T049 [P] [US3] Test de integración de descarte y regeneración del aviso en `backend/tests/integration/aviso-descarte.test.js`
- [x] T050 [P] [US3] Test de integración de la difusión de `aviso.descartado` a todos los clientes SSE y coherencia al reconectar en `backend/tests/integration/aviso-descarte-global.test.js`
- [x] T051 [P] [US3] Test de componente de la acción de descartar (una sola acción; deshabilitada sin conexión) en `frontend/tests/components/DescartarAviso.test.jsx`
- [x] T052 [P] [US3] Test de integración de descarte global en dos pantallas (una descarta y el aviso desaparece en ambas) en `frontend/tests/integration/descarte-global.test.jsx`

### Implementation for User Story 3

- [x] T053 [US3] Implementar la lógica de descarte del aviso (idempotente) en `backend/src/services/avisos.js`
- [x] T054 [US3] Implementar `POST /api/sala/avisos/{avisoId}/descartar` y difundir `aviso.descartado` (claves en `snake_case`: `aviso_id`, `mesa_id`, `descartado_en`) en `backend/src/routes/sala.js` y `backend/src/realtime/emit.js`
- [x] T055 [US3] Excluir los avisos descartados de la instantánea de sala y no mostrar avisos de mesas que dejan de estar abiertas por cierre de cuenta (coherencia al reconectar) en `backend/src/services/salaMesas.js`
- [x] T056 [US3] Implementar la acción de descartar en el aviso en `frontend/src/components/AvisoMesa.jsx`
- [x] T057 [US3] Gestionar los eventos `aviso.descartado` en el estado de sala (retirada en todas las pantallas y coherencia tras reconectar) en `frontend/src/hooks/useSala.js`

**Checkpoint**: Las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias

- [ ] T058 [P] Actualizar la documentación de puesta en marcha y de la funcionalidad en `README.md`
- [ ] T059 [P] Revisar que todos los textos visibles están en español de España en `frontend/src/`
- [ ] T060 Revisar y probar la coherencia del comportamiento sin conexión (indicador, información marcada como no actualizada) y la resincronización en `frontend/src/hooks/useSala.js`
- [ ] T061 [P] Verificar que `.gitignore` excluye `.env` y que no hay secretos en el repositorio (`.gitignore`)
- [ ] T062 Ejecutar los escenarios de validación A–G de `specs/005-senales-platos-listos/quickstart.md`, incluyendo la comprobación **manual** explícita de SC-001 (identificar los platos listos en ≤ 2 s) y SC-005 (descartar con una sola acción en ≤ 2 s)
- [ ] T063 Ejecutar los escenarios H, E2 e I (descarte global desde dos pantallas; edición de una comanda ya enviada; cierre de la cuenta de una mesa con aviso activo) de `specs/005-senales-platos-listos/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; puede empezar de inmediato (es verificación de base ya existente)
- **Foundational (Phase 2)**: Depende de Setup; BLOQUEA todas las historias
- **User Stories (Phase 3+)**: Dependen de Foundational
  - Pueden ir en paralelo (si hay personal) o en orden de prioridad (P1 → P2 → P3)
- **Polish (Phase 6)**: Depende de las historias deseadas

### User Story Dependencies

- **US1 (P1)**: Empieza tras Foundational; sin dependencias de otras historias. Incluye el mecanismo mínimo de marcado (FR-016) que produce el estado que todas las historias consumen.
- **US2 (P2)**: Empieza tras Foundational; reutiliza la costura de cambio de estado de US1 (T020) para detectar la completitud y añade el recálculo al confirmar la edición de una comanda enviada (T041/T042, punto `enviar-cambios`), pero es probable por separado.
- **US3 (P3)**: Empieza tras Foundational; reutiliza el aviso creado por US2, pero es probable por separado. La retirada del aviso al cerrarse la cuenta (FR-010) es del cierre de cuenta (historia 06); aquí solo se prepara la regla "mesa no abierta ⇒ sin aviso" (T018/T019/T055).

### Within Each User Story

- Las pruebas se escriben y FALLAN antes de implementar
- Acceso a datos y servicios antes que rutas
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
Task: "Test unitario de la instantánea de sala en backend/tests/unit/salaMesas.test.js"
Task: "Test de contrato del estado de línea en backend/tests/contract/estado-linea.test.js"
Task: "Test de componente de la vista de sala en frontend/tests/components/SalaEstado.test.jsx"

# Componentes de US1 en paralelo:
Task: "Implementar PlatoEstado en frontend/src/components/PlatoEstado.jsx"
Task: "Implementar MesaCard en frontend/src/components/MesaCard.jsx"
Task: "Reutilizar el estado sin conexión en frontend/src/components/AvisoSinConexion.jsx"
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

1. Setup + Foundational → base verificada
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
