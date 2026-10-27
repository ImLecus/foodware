---
description: "Task list for feature 006-cierre-cuenta-division"
---

# Tasks: Cierre y división de cuenta

**Input**: Design documents from `/specs/006-cierre-cuenta-division/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.md`, `quickstart.md`.

**Tests**: Incluidas. La constitución exige que cada funcionalidad tenga pruebas automatizadas.

**Organization**: Tareas agrupadas por historia: US1 (P1, cierre y total), US2 (P2, división) y
US3 (P3, ticket y liberación de mesa).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (ficheros distintos, sin dependencias pendientes).
- **[Story]**: US1, US2 o US3; no se usa en Setup, Foundational ni Polish.
- Todas las tareas incluyen la ruta exacta del fichero.

## Path Conventions

Aplicación web: `backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`, `backend/migrations/`.

---

## Phase 1: Setup

**Purpose**: Preparar datos de prueba y escenarios reproducibles para la nueva reutilización de mesas.

- [x] T001 [P] Ampliar `backend/tests/helpers/fixtures.js` con helpers para crear una cuenta cerrada histórica, una comanda nueva sobre la misma mesa y líneas pendientes de cocina
- [x] T002 [P] Añadir en `backend/src/db/seed.js` un escenario de mesa reutilizable y una línea pendiente de cocina para validar el nuevo flujo

**Checkpoint**: existen fixtures y datos demo para mesas reutilizadas y platos pendientes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Asociar cada cuenta a su pedido y centralizar la detección de platos pendientes.

**⚠️ CRITICAL**: US1, US2 y US3 dependen de esta fase.

- [x] T003 Crear la migración `backend/migrations/007_cuenta_pedido.sql` que añade `cuentas.pedido_id` con referencia a `pedidos` e índice por mesa/pedido
- [x] T004 [P] Añadir pruebas unitarias de la consulta de cuenta por pedido y de la lista de platos pendientes en `backend/tests/unit/cuentasService.test.js`
- [x] T005 Añadir en `backend/src/db/pedidos.js` un helper para obtener la comanda actual de la mesa y las líneas pendientes de pedidos enviados
- [x] T006 [P] Añadir pruebas de contrato de los campos `pedido_id` y `platos_pendientes` de `GET /api/sala/mesas/:mesaId/cuenta` en `backend/tests/contract/cuenta-get.test.js`
- [x] T007 Actualizar `backend/src/services/cuentasService.js` para consultar la cuenta por `pedido_id`, ignorar cuentas históricas de comandas anteriores y exponer `platos_pendientes`
- [x] T008 Actualizar `backend/src/routes/cuentas.js` para devolver los nuevos campos y mantener el contrato de errores `{ codigo, mensaje }`

**Checkpoint**: la cuenta se resuelve por comanda y el backend conoce los platos pendientes de cocina.

---

## Phase 3: User Story 1 - Cerrar la cuenta y calcular el total (Priority: P1) 🎯 MVP

**Goal**: cerrar la cuenta de una mesa sin platos pendientes, conservar el histórico y liberar la mesa inmediatamente para una nueva comanda.

**Independent Test**: abrir una mesa, cerrar su cuenta sin división, comprobar el ticket y el total, verificar que la mesa aparece libre y que puede abrirse una nueva comanda.

### Tests for User Story 1

- [x] T009 [P] [US1] Añadir contrato de cierre único que bloquea platos pendientes con `409 platos_pendientes` y devuelve el listado, en `backend/tests/contract/ticket-cierre.test.js`
- [x] T010 [P] [US1] Actualizar la integración de cierre único para comprobar mesa libre, histórico de cuenta y nueva comanda, en `backend/tests/integration/cierre-total.test.js`
- [x] T011 [P] [US1] Añadir prueba de `ResumenCuenta`/`CierreCuenta` que muestra platos pendientes y no permite cerrar, en `frontend/tests/components/ResumenCuenta.test.jsx` y `frontend/tests/pages/CierreCuenta.test.jsx`

### Implementation for User Story 1

- [x] T012 [US1] Actualizar `backend/src/services/cuentasService.js` para bloquear `cerrarCuentaUnica` si hay platos pendientes y cambiar la mesa a `libre` al cerrar, conservando la cuenta cerrada
- [x] T013 [US1] Actualizar `backend/src/db/mesas.js` y `backend/src/domain/pedidos.js` para que una mesa liberada pueda abrir una comanda nueva y no se confunda con una cuenta histórica
- [x] T014 [US1] Actualizar `frontend/src/hooks/useCuenta.js` y `frontend/src/services/api.js` para propagar `platos_pendientes` y distinguir `409`/`422` de un error de red
- [x] T015 [US1] Actualizar `frontend/src/components/ResumenCuenta.jsx` y `frontend/src/pages/CierreCuenta.jsx` para mostrar los platos pendientes y permitir reintentar el cierre
- [x] T016 [US1] Actualizar `frontend/src/pages/Mesas.jsx` y `frontend/src/services/events.js` para refrescar la mesa como libre tras `mesa-cerrada`

**Checkpoint**: User Story 1 funciona de forma independiente y la mesa se reutiliza.

---

## Phase 4: User Story 2 - Dividir la cuenta entre comensales (Priority: P2)

**Goal**: dividir una cuenta de la comanda actual sin perder la asociación con el pedido ni mezclar cuentas históricas.

**Independent Test**: dividir una cuenta en partes iguales y por consumo, comprobar la suma y verificar que la división persiste asociada al pedido actual aunque la mesa ya tenga una cuenta cerrada anterior.

### Tests for User Story 2

- [x] T017 [P] [US2] Añadir contrato de división que comprueba `pedido_id`, partes y suma para una mesa reutilizada, en `backend/tests/contract/division-cuenta.test.js`
- [x] T018 [P] [US2] Añadir integración de división sobre una comanda nueva de una mesa con histórico, en `backend/tests/integration/division-cuenta.test.js`
- [x] T019 [P] [US2] Actualizar la prueba de `DivisionCuenta`/`CierreCuenta` para partir de la cuenta de la comanda actual, en `frontend/tests/components/DivisionCuenta.test.jsx` y `frontend/tests/pages/CierreCuenta.test.jsx`

### Implementation for User Story 2

- [x] T020 [US2] Actualizar `backend/src/services/cuentasService.js` para persistir `pedido_id` en `confirmarDivision` y rechazar operaciones sobre cuentas de pedidos anteriores
- [x] T021 [US2] Actualizar `frontend/src/hooks/useCuenta.js` para conservar el `pedido_id` y recargar la cuenta correcta después de dividir o cambiar de comanda

**Checkpoint**: User Stories 1 y 2 funcionan de forma independiente sobre mesas reutilizadas.

---

## Phase 5: User Story 3 - Ticket final y liberación de la mesa (Priority: P3)

**Goal**: cerrar la cuenta al pagar la última parte solo si no hay platos pendientes, emitir un único ticket y liberar la mesa para una nueva comanda.

**Independent Test**: dividir una cuenta, pagar partes intermedias sin ticket, intentar pagar la última con un plato pendiente y comprobar el bloqueo; tras cocina, pagar la última, ver el ticket único y reutilizar la mesa.

### Tests for User Story 3

- [x] T022 [P] [US3] Añadir contrato de pago de última parte con platos pendientes y de liberación de mesa, en `backend/tests/contract/ticket-reversion.test.js`
- [x] T023 [P] [US3] Actualizar la integración de ticket único y reversión para comprobar mesa libre, histórico y nueva comanda, en `backend/tests/integration/ticket-unico-reversion.test.js`
- [x] T024 [P] [US3] Añadir prueba de interfaz de `ParteCuenta`/`TicketFinal` para el bloqueo por cocina y la mesa libre, en `frontend/tests/components/ParteCuenta.test.jsx` y `frontend/tests/components/TicketFinal.test.jsx`

### Implementation for User Story 3

- [x] T025 [US3] Actualizar `backend/src/services/cuentasService.js` para bloquear el pago de la última parte si hay platos pendientes, liberar la mesa como `libre` y emitir el ticket solo al cerrar
- [x] T026 [US3] Actualizar `backend/src/services/cuentasService.js` para que `obtenerTicket` use la última cuenta cerrada de la mesa y no una cuenta abierta de una comanda nueva
- [x] T027 [US3] Actualizar `backend/src/realtime/emit.js` y `backend/src/services/cuentasService.js` para publicar `mesa-cerrada` con la mesa liberada y permitir que sala la muestre como disponible
- [x] T028 [US3] Actualizar `frontend/src/components/ParteCuenta.jsx`, `frontend/src/components/TicketFinal.jsx`, `frontend/src/pages/CierreCuenta.jsx` y `frontend/src/services/api.js` para mostrar el bloqueo, el ticket y el estado libre

**Checkpoint**: las tres historias funcionan sobre una mesa que puede reutilizarse.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Eliminar restos del comportamiento antiguo, documentar y validar el flujo completo.

- [x] T029 [P] Actualizar `README.md` y `specs/006-cierre-cuenta-division/quickstart.md` con login, mesa liberada, bloqueo por cocina y reutilización
- [x] T030 [P] Actualizar las expectativas de estado de mesa en `backend/tests/integration/cierre-ticket.test.js`, `backend/tests/integration/mesa-cerrada.test.js` y `frontend/tests/integration/cierre-cuenta.test.jsx`
- [x] T031 [P] Revisar `specs/006-cierre-cuenta-division/deuda.md` y eliminar o marcar como resueltas las deudas de mesa cerrada y estado `cerrada`
- [x] T032 Ejecutar las suites completas de `backend/tests/` y `frontend/tests/`, corregir regresiones y comprobar que las historias 001–005 siguen funcionando con sesión real
- [x] T033 Ejecutar los escenarios M y N de `specs/006-cierre-cuenta-division/quickstart.md` y registrar la verificación en `specs/006-cierre-cuenta-division/verification.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup y bloquea las historias.
- **US1 (Phase 3)**: depende de Foundational; es el MVP.
- **US2 (Phase 4)**: depende de Foundational y de la API de cuenta de US1; puede implementarse después de US1.
- **US3 (Phase 5)**: depende de US1/US2 y de la validación de cocina.
- **Polish (Phase 6)**: depende de las historias implementadas.

### User Story Dependencies

- **US1**: independiente; entrega cierre, total, mesa libre y bloqueo por cocina.
- **US2**: extiende la cuenta actual; debe respetar `pedido_id`.
- **US3**: extiende el cierre y el pago por partes; no puede liberar la mesa con platos pendientes.

### Parallel Opportunities

- T001/T002, T004/T007, T009/T010/T011, T017/T018/T019, T022/T023/T024 y T029/T030/T031 pueden ir en paralelo.
- No paralelizar tareas que modifiquen el mismo fichero: `backend/src/services/cuentasService.js`, `frontend/src/hooks/useCuenta.js`, `frontend/src/pages/CierreCuenta.jsx` y `backend/src/routes/cuentas.js`.
- Las pruebas de cada historia se escriben antes de su implementación y deben fallar inicialmente.

## Parallel Example: User Story 1

```bash
# Pruebas en paralelo:
Task: "Contrato de cierre con platos pendientes en backend/tests/contract/ticket-cierre.test.js"
Task: "Integración de mesa libre y reutilización en backend/tests/integration/cierre-total.test.js"
Task: "Componente de aviso de pendientes en frontend/tests/components/ResumenCuenta.test.jsx"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Setup y Foundational.
2. Implementar US1: cierre, bloqueo por cocina y mesa libre.
3. Validar el escenario B y M de `quickstart.md`.
4. Continuar con US2 y US3.

### Incremental Delivery

1. Migración y consulta por pedido.
2. Cierre único y reutilización de mesa.
3. División sobre la comanda actual.
4. Ticket único y liberación tras la última parte.
5. Documentación y regresión completa.

## Notes

- `mesas.estado` pasa a `libre` al cerrar; `cerrada` no se produce en el flujo nuevo.
- La cuenta se asocia a `pedido_id`; una cuenta cerrada anterior no bloquea una comanda nueva.
- Los errores de negocio (`409`, `422`, `403`) no deben mostrarse como «sin conexión».
- No se cancela ni se marca automáticamente ningún plato: si hay pendientes, se bloquea el cierre.
