# Tasks: Cierre y división de cuenta

**Input**: Design documents from `/specs/006-cierre-cuenta-division/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: La constitución de Foodware exige pruebas automatizadas junto a cada funcionalidad ("sin pruebas, la funcionalidad no está completa"), por lo que **sí** se generan tareas de prueba.

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y prueba independientes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias)
- **[Story]**: Historia a la que pertenece la tarea (US1, US2, US3)
- Cada descripción incluye la ruta exacta del fichero

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/` (según `plan.md`)

**Frontera de propiedad de datos (obligatoria)**: la historia 006 solo **escribe** sus tablas
(`cuentas`, `cuentas_partes`, `cuentas_parte_consumos`) y **cierra la mesa**; **solo lee** las
mesas y las líneas de pedido (consumos) de las historias 01–04.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialización del proyecto y estructura básica

- [ ] T001 Crear/verificar la estructura de carpetas del proyecto (`backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`) según `specs/006-cierre-cuenta-division/plan.md`
- [ ] T002 [P] Asegurar la configuración de Vitest + Supertest (backend) y Vitest + React Testing Library (frontend) en `backend/package.json` y `frontend/package.json`
- [ ] T003 [P] Asegurar `docker-compose.yml` (frontend y backend; SQLite en volumen), `backend/Dockerfile` y `frontend/Dockerfile`
- [ ] T004 [P] Asegurar `backend/.env.example` sin secretos y la sección de arranque en `README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura común que MUST estar lista antes de empezar cualquier historia

**⚠️ CRITICAL**: Ninguna historia puede empezar hasta completar esta fase

- [ ] T005 Implementar el conexión a SQLite en `backend/src/db.js`
- [ ] T006 Crear la migración de la historia 006 (`cuentas`, `cuentas_partes` con `id`, `cuenta_id`, `orden`, `comensal`, `importe_cent`, `estado`, `pagada_en`; y `cuentas_parte_consumos`) en `backend/src/migrations/002_cuentas.sql` (solo tablas propias de 006; NO crear `mesas` ni líneas de pedido, que pertenecen a las historias 01–04)
- [ ] T007 [P] Ampliar los datos de ejemplo con una mesa abierta con consumos y precios fijados al pedir en `backend/scripts/seed.js`
- [ ] T008 [P] Reutilizar el hub SSE de la historia 005 y exponer la emisión del evento `mesa-cerrada` en `backend/src/realtime/eventos.js`
- [ ] T009 Implementar el bootstrap de la app Express y del servidor HTTP (montaje de rutas y uso del hub) en `backend/src/app.js` y `backend/src/server.js`
- [ ] T010 [P] Implementar el middleware de manejo de errores (400/404/409/422/500) en `backend/src/middleware/errores.js`
- [ ] T011 Añadir el arnés de pruebas del backend (factoría de app y base de datos de test) en `backend/tests/helpers/`

**Checkpoint**: Infraestructura lista; las historias pueden empezar

---

## Phase 3: User Story 1 - Cerrar la cuenta y calcular el total (Priority: P1) 🎯 MVP

**Goal**: El camarero abre la cuenta de una mesa, ve el total calculado a partir de lo consumido con el precio fijado al pedir, y puede confirmar el cobro o cancelar el cierre sin que nada cambie.

**Independent Test**: Abrir una mesa con consumos, abrir su cuenta y comprobar que el total mostrado coincide con la suma de los platos; cancelar y comprobar que la mesa y la cuenta siguen igual; confirmar un pago único y comprobar que la mesa se cierra.

### Tests for User Story 1 ⚠️

> **NOTE: Escribir estas pruebas PRIMERO y comprobar que fallan antes de implementar**

- [ ] T012 [P] [US1] Test de contrato de `GET /api/sala/mesas/:mesaId/cuenta` (200, mesa sin consumos, 404, 409) en `backend/tests/contract/cuenta-get.test.js`
- [ ] T013 [P] [US1] Test unitario de `cuentasService` (total en céntimos con precio fijado, mesa sin consumos) en `backend/tests/unit/cuentasService.test.js`
- [ ] T014 [P] [US1] Test de componente de `ResumenCuenta` (total en € con formato español, estado de carga y vacío) en `frontend/tests/components/ResumenCuenta.test.jsx`

### Implementation for User Story 1

- [ ] T015 [US1] Implementar `cuentasService` (cálculo del total en céntimos y cuenta abierta derivada) en `backend/src/services/cuentasService.js`
- [ ] T016 [US1] Implementar `GET /api/sala/mesas/:mesaId/cuenta` en `backend/src/routes/cuentas.js`
- [ ] T017 [US1] Implementar `POST /api/sala/mesas/:mesaId/cuenta/cierre` para `modo = "unico"` (cierre de la cuenta, rechazo `409` si ya está cerrada) en `backend/src/routes/cuentas.js`
- [ ] T018 [P] [US1] Implementar el formateo de importes en € y números/fechas con convención española en `frontend/src/services/formato.js`
- [ ] T019 [US1] Implementar las llamadas del frontend a la cuenta y al cierre único en `frontend/src/services/api.js`
- [ ] T020 [US1] Implementar el hook `useCuenta` (carga de la cuenta, estado de carga/error y "sin conexión") en `frontend/src/hooks/useCuenta.js`
- [ ] T021 [P] [US1] Implementar el componente `ResumenCuenta` (total y consumos) en `frontend/src/components/ResumenCuenta.jsx`
- [ ] T022 [US1] Implementar la página `CierreCuenta` (abrir cuenta, mostrar total, cancelar el cierre) en `frontend/src/pages/CierreCuenta.jsx`
- [ ] T023 [US1] Test de integración de US1 (calcular total, cancelar sin cambios y cerrar con pago único) en `backend/tests/integration/cierre-total.test.js`

**Checkpoint**: User Story 1 totalmente funcional y probable por separado

---

## Phase 4: User Story 2 - Dividir la cuenta entre comensales (Priority: P2)

**Goal**: El camarero divide la cuenta en partes iguales (con reparto exacto de céntimos) o según lo consumido por cada comensal (asignando platos o porciones), quedando cada parte asociada a un comensal y sumando exactamente el total.

**Independent Test**: Dividir una cuenta en varias partes iguales y por consumo, comprobar el reparto de céntimos y que la suma coincide con el total en ambos modos.

> **Dependencia**: extiende la ruta de cierre y los ficheros de US1 (`routes/cuentas.js`, `cuentasService.js`, `api.js`, `useCuenta.js`, `CierreCuenta.jsx`); implementar US2 después de US1.

### Tests for User Story 2 ⚠️

- [ ] T024 [P] [US2] Test unitario de `divisionService` (partes iguales con reparto de céntimos, por consumo, porciones y suma exacta) en `backend/tests/unit/divisionService.test.js`
- [ ] T025 [P] [US2] Test de contrato de `POST .../cuenta/cierre` con división (201, `422` por suma incorrecta y por total base cambiado) en `backend/tests/contract/cierre-division.test.js`
- [ ] T026 [P] [US2] Test de componente de `DivisionCuenta` (partes iguales y por consumo, suma mostrada) en `frontend/tests/components/DivisionCuenta.test.jsx`

### Implementation for User Story 2

- [ ] T027 [US2] Implementar `divisionService` (partes iguales con reparto de céntimos de uno en uno, por consumo con porciones, y validación de la suma y del total base) en `backend/src/services/divisionService.js`
- [ ] T028 [US2] Extender `cuentasService` para persistir las partes (incluido `comensal`) y las asignaciones en la transacción de cierre en `backend/src/services/cuentasService.js`
- [ ] T029 [US2] Extender `POST .../cuenta/cierre` para aceptar `modo` `iguales`/`por_consumo` con `partes` (incluido `comensal` obligatorio) y `asignaciones`, validando `422` (comensal, suma y total base) e invalidando cualquier división persistida anterior (FR-017) en `backend/src/routes/cuentas.js` y `backend/src/services/cuentasService.js`
- [ ] T030 [US2] Ampliar las llamadas del frontend con el cierre por división en `frontend/src/services/api.js`
- [ ] T031 [P] [US2] Implementar el componente `DivisionCuenta` (elección de partes iguales o por consumo y número de partes) en `frontend/src/components/DivisionCuenta.jsx`
- [ ] T032 [P] [US2] Implementar el componente `AsignarConsumos` (asignación de platos o porciones a las partes) en `frontend/src/components/AsignarConsumos.jsx`
- [ ] T033 [US2] Implementar el componente `ParteCuenta` (importe y comensal de una parte) en `frontend/src/components/ParteCuenta.jsx`
- [ ] T034 [US2] Extender `useCuenta` (construcción de la división, total base y reinicio al cambiar la cuenta) en `frontend/src/hooks/useCuenta.js`
- [ ] T035 [US2] Integrar la división en la página `CierreCuenta` en `frontend/src/pages/CierreCuenta.jsx`
- [ ] T036 [US2] Test de integración de la división (partes iguales con redondeo, división por consumo, persistencia del comensal de cada parte y reinicio de una división persistida al cambiar la cuenta) en `backend/tests/integration/cierre-division.test.js`

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente

---

## Phase 5: User Story 3 - Ticket final y cierre de la mesa (Priority: P3)

**Goal**: Al pagarse la última parte de una cuenta dividida (o al confirmar el pago único), el sistema emite un único ticket con el total y el desglose de cada parte, cierra la mesa y rechaza cualquier operación posterior sobre ella. Mientras la mesa siga abierta, una parte pagada puede volver a pendiente.

**Independent Test**: Confirmar el cobro de una cuenta dividida pagando las partes una a una, comprobar que no hay ticket hasta la última y que entonces se emite uno único con el total y cada parte; deshacer un pago con la mesa abierta y comprobar que la mesa no se cierra con partes pendientes.

> **Dependencia**: extiende la ruta de cierre y los ficheros de US1/US2; implementar US3 después de US1 y US2.

### Tests for User Story 3 ⚠️

- [ ] T037 [P] [US3] Test unitario de `ticketService` (total y desglose de partes) en `backend/tests/unit/ticketService.test.js`
- [ ] T038 [P] [US3] Test de contrato de `GET .../cuenta/ticket` (409 `ticket_no_emitido` antes de la última parte) y de `POST .../cuenta/cierre` con división o partes pendientes (409, 422) en `backend/tests/contract/ticket-cierre.test.js`
- [ ] T039 [P] [US3] Test de componente de `TicketFinal` (total y desglose de cada parte) en `frontend/tests/components/TicketFinal.test.jsx`
- [ ] T040 [P] [US3] Test de contrato del marcado y reversión de pagos y de la emisión única del ticket (marcar parte: `200`, `404`, `409` con mesa cerrada; partes intermedias con `ticketEstado = no_emitido` y `ticket = null`; ticket único al pagar la última; `200` al deshacer con mesa abierta y `409` con mesa cerrada) en `backend/tests/contract/ticket-reversion.test.js`
- [ ] T041 [P] [US3] Test de componente de `ParteCuenta` (deshacer el pago con confirmación, vuelta a `pendiente` y mesa abierta) en `frontend/tests/components/ParteCuenta.test.jsx`
- [ ] T042 [US3] Test de componente del aviso «sin ticket hasta el pago completo» (cuenta abierta con partes pagadas y `ticketEstado = no_emitido`) en `frontend/tests/components/TicketFinal.test.jsx`

### Implementation for User Story 3

- [ ] T043 [US3] Implementar `ticketService` (composición del ticket con el total y las partes) en `backend/src/services/ticketService.js`
- [ ] T044 [US3] Implementar el estado derivado del ticket (`no_emitido`/`emitido`) y su exposición en la cuenta, el pago y la reversión en `backend/src/services/ticketService.js`
- [ ] T045 [US3] Implementar `POST /api/sala/mesas/:mesaId/cuenta/partes/:parteId/pago` (200, 404, 409 si la mesa está cerrada) y exigir que todas las partes estén pagadas para cerrar la mesa (el cierre de una cuenta dividida solo se produce al pagar la última parte), devolviendo el ticket único en `backend/src/routes/cuentas.js` y `backend/src/services/cuentasService.js`
- [ ] T046 [US3] Implementar `GET /api/sala/mesas/:mesaId/cuenta/ticket` (200 solo si la cuenta está cerrada y el ticket emitido; `404` y `409` con `ticketEstado = no_emitido` en caso contrario) en `backend/src/routes/cuentas.js`
- [ ] T047 [US3] Marcar la mesa como cerrada (`abierta = false`) dentro de la transacción de cierre y rechazar nuevas operaciones sobre una mesa cerrada (`409`) en `backend/src/services/cuentasService.js` y `backend/src/routes/cuentas.js`
- [ ] T048 [US3] Emitir el ticket dentro de la misma transacción que marca la última parte pendiente como pagada, sin emitirlo en partes intermedias, en `backend/src/services/cuentasService.js`
- [ ] T049 [US3] Emitir el evento `mesa-cerrada` por el hub SSE al confirmar el cierre en `backend/src/routes/cuentas.js` y `backend/src/realtime/eventos.js`
- [ ] T050 [US3] Implementar `DELETE /api/sala/mesas/:mesaId/cuenta/partes/:parteId/pago` para devolver una parte pagada a pendiente (200, 404, 409 con mesa cerrada, 422) en `backend/src/routes/cuentas.js` y `backend/src/services/cuentasService.js`
- [ ] T051 [US3] Recalcular el estado de la mesa al deshacer un pago (sigue abierta si quedan partes pendientes) y emitir, si procede, el evento de actualización en `backend/src/services/cuentasService.js` y `backend/src/realtime/eventos.js`
- [ ] T052 [P] [US3] Implementar el componente `TicketFinal` (total y desglose de partes) en `frontend/src/components/TicketFinal.jsx`
- [ ] T053 [US3] Añadir el marcado de pago por parte llamando a `POST .../partes/:parteId/pago` en `frontend/src/components/ParteCuenta.jsx` y `frontend/src/services/api.js`
- [ ] T054 [P] [US3] Añadir la llamada `DELETE` de deshacer el pago de una parte en `frontend/src/services/api.js`
- [ ] T055 [US3] Implementar en `ParteCuenta` la acción de deshacer el pago con confirmación y el paso a `pendiente` en `frontend/src/components/ParteCuenta.jsx`
- [ ] T056 [US3] Extender `useCuenta` para deshacer el pago de una parte y recalcular el estado de la mesa en `frontend/src/hooks/useCuenta.js`
- [ ] T057 [US3] Mostrar el aviso «sin ticket hasta el pago completo» mientras la cuenta siga abierta en `frontend/src/components/TicketFinal.jsx`
- [ ] T058 [US3] Extender `useCuenta` y la página `CierreCuenta` (pago por partes, impedir el cierre con partes pendientes, mostrar el ticket único y reflejar el estado de la mesa) en `frontend/src/hooks/useCuenta.js` y `frontend/src/pages/CierreCuenta.jsx`
- [ ] T059 [US3] Test de integración del cierre con pago por partes, ticket y mesa cerrada en `backend/tests/integration/cierre-ticket.test.js`
- [ ] T060 [US3] Test de integración de la emisión única del ticket y de la reversión de partes (intermedias sin ticket, ticket único al pagar la última, 409 al deshacer con mesa cerrada y reversión válida con mesa abierta) en `backend/tests/integration/ticket-unico-reversion.test.js`
- [ ] T061 [US3] Test de integración del flujo de cierre en el frontend (total → división → pago → ticket) en `frontend/tests/integration/cierre-cuenta.test.jsx`

**Checkpoint**: Las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras que afectan a varias historias

- [ ] T062 [P] Actualizar la documentación de puesta en marcha y de la funcionalidad en `README.md`
- [ ] T063 [P] Revisar que todos los textos visibles estén en español de España y los importes en € con formato español en `frontend/src/`
- [ ] T064 Revisar la frontera de datos: 006 solo escribe sus tablas y cierra la mesa, sin escrituras en mesas ni consumos ajenos en `backend/src/services/cuentasService.js`
- [ ] T065 [P] Verificar que `.gitignore` excluye `.env` y que no hay secretos en el repositorio (`.gitignore`)
- [ ] T066 Verificar la reproducibilidad de Docker con `docker compose up --build` (`docker-compose.yml`)
- [ ] T067 Ejecutar los escenarios de validación A–I de `specs/006-cierre-cuenta-division/quickstart.md`
- [ ] T068 Ejecutar los escenarios de validación J, K y L de `specs/006-cierre-cuenta-division/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias; puede empezar de inmediato
- **Foundational (Phase 2)**: Depende de Setup; BLOQUEA todas las historias
- **User Stories (Phase 3+)**: Dependen de Foundational
  - Pueden ir en orden de prioridad (P1 → P2 → P3); US2 y US3 extienden ficheros de US1
- **Polish (Phase 6)**: Depende de las historias deseadas

### User Story Dependencies

- **US1 (P1)**: Empieza tras Foundational; sin dependencias de otras historias
- **US2 (P2)**: Empieza tras Foundational; **extiende** el cierre y la API creados en US1 (`routes/cuentas.js`, `cuentasService.js`, `api.js`, `useCuenta.js`, `CierreCuenta.jsx`). Se implementa después de US1
- **US3 (P3)**: Empieza tras Foundational; **extiende** el cierre de US1/US2 (pago y reversión de partes, emisión única del ticket, bloqueo de mesa). Se implementa después de US1 y US2

### Within Each User Story

- Las pruebas se escriben y FALLAN antes de implementar
- Servicios antes que rutas
- Backend antes que su integración en el frontend
- Implementación base antes de la integración entre historias

### Ficheros compartidos entre historias (serializar, no paralelizar entre historias)

- `backend/src/routes/cuentas.js` (US1 → US2 → US3)
- `backend/src/services/cuentasService.js` (US1 → US2 → US3)
- `backend/src/services/ticketService.js` (US3)
- `frontend/src/services/api.js` (US1 → US2 → US3)
- `frontend/src/hooks/useCuenta.js` (US1 → US2 → US3)
- `frontend/src/pages/CierreCuenta.jsx` (US1 → US2 → US3)
- `frontend/src/components/ParteCuenta.jsx` (US2 → US3)
- `frontend/src/components/TicketFinal.jsx` (US3)

### Parallel Opportunities

- Todas las tareas [P] de Setup pueden ir en paralelo
- Todas las tareas [P] de Foundational pueden ir en paralelo
- Dentro de cada historia, las pruebas [P] y los componentes [P] pueden ir en paralelo
- US1, US2 y US3 **no** son paralelas entre sí (comparten ficheros); dentro de cada una, las tareas [P] sí

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 en paralelo:
Task: "Test de contrato de GET /api/sala/mesas/:mesaId/cuenta en backend/tests/contract/cuenta-get.test.js"
Task: "Test unitario de cuentasService en backend/tests/unit/cuentasService.test.js"
Task: "Test de componente de ResumenCuenta en frontend/tests/components/ResumenCuenta.test.jsx"
```

## Parallel Example: User Story 2

```bash
# Pruebas de US2 en paralelo:
Task: "Test unitario de divisionService en backend/tests/unit/divisionService.test.js"
Task: "Test de contrato de POST .../cuenta/cierre con división en backend/tests/contract/cierre-division.test.js"
Task: "Test de componente de DivisionCuenta en frontend/tests/components/DivisionCuenta.test.jsx"

# Componentes de US2 en paralelo:
Task: "Implementar DivisionCuenta en frontend/src/components/DivisionCuenta.jsx"
Task: "Implementar AsignarConsumos en frontend/src/components/AsignarConsumos.jsx"
```

## Parallel Example: User Story 3

```bash
# Pruebas de US3 en paralelo:
Task: "Test de contrato de emisión única y reversión en backend/tests/contract/ticket-reversion.test.js"
Task: "Test de componente de ParteCuenta en frontend/tests/components/ParteCuenta.test.jsx"
Task: "Test de componente del aviso sin ticket en frontend/tests/components/TicketFinal.test.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Fase 1: Setup
2. Completar Fase 2: Foundational (CRÍTICO)
3. Completar Fase 3: User Story 1
4. **PARAR Y VALIDAR**: probar US1 de forma independiente (escenarios A y B de `quickstart.md`)
5. Desplegar/demostrar si está listo

### Incremental Delivery

1. Setup + Foundational → base lista
2. Añadir US1 → probar → demostrar (MVP: cobrar la mesa con el total correcto)
3. Añadir US2 → probar → demostrar (reparto entre comensales)
4. Añadir US3 → probar → demostrar (pago por partes, reversión, ticket único y cierre de la mesa)
5. Cada historia añade valor sin romper las anteriores

### Parallel Team Strategy

Con varias personas: completar Setup + Foundational en equipo y después asignar **una sola
persona por historia**, avanzando en orden de prioridad (US1 → US2 → US3) porque comparten
ficheros (`routes/cuentas.js`, `cuentasService.js`, `useCuenta.js`, `CierreCuenta.jsx`).

---

## Notes

- [P] = ficheros distintos, sin dependencias
- T039 debe completarse antes de T042 (ambas escriben `frontend/tests/components/TicketFinal.test.jsx`)
- [Story] mapea cada tarea a su historia para trazabilidad
- Verificar que cada prueba falla antes de implementar
- **Parada por tarea (constitución)**: al implementar con `/speckit.implement`, el agente MUST detenerse tras cada tarea, resumir lo hecho y esperar la revisión y el commit del usuario antes de continuar
- Commits en formato Conventional Commits (p. ej. `feat(006): ...`)
- Commit tras cada tarea o grupo lógico
- Antes de crear la rama de trabajo, partir de `develop` con `feature/006-cierre-cuenta-division` (Git Flow)
