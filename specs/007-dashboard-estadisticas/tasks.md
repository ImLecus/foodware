---
description: "Task list for feature 007-dashboard-estadisticas"
---

# Tareas: Dashboard de estadísticas del servicio

**Entrada**: Documentos de diseño en `/specs/007-dashboard-estadisticas/`

**Prerrequisitos**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`.

**Pruebas**: Obligatorias según la constitución. Las pruebas se escriben antes de la implementación.

**Organización**: US1 (P1, total diario), US2 (P1, desgloses) y US3 (P2, comparación).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: puede ejecutarse en paralelo (ficheros distintos, sin dependencia pendiente).
- **[Story]**: US1, US2 o US3; no se usa en Setup, Foundational ni Polish.
- Todas las tareas incluyen la ruta exacta del fichero.

## Convenciones de rutas

- Aplicación web: `backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`.
- Contratos: `specs/007-dashboard-estadisticas/contracts/`.

---

## Phase 1: Setup

**Purpose**: Preparar datos y helpers para reproducir el fallo del día en curso.

- [x] T001 [P] Ampliar `backend/tests/helpers/fixtures.js` con un helper para insertar cuentas cerradas con fechas relativas a hoy
- [x] T002 [P] Confirmar en `backend/tests/helpers/auth.js` y `frontend/tests/helpers/auth.jsx` que existe una sesión de encargado reutilizable para las pruebas del dashboard

**Checkpoint**: los tests pueden crear escenarios de ayer/hoy sin depender de la fecha real.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Resolver la fecha por defecto del dashboard antes de tocar las tres historias.

**⚠️ CRITICAL**: US1, US2 y US3 dependen de esta fase.

- [x] T003 [P] Añadir pruebas unitarias de la fecha por defecto y del día natural completado en `backend/tests/unit/reporting_fecha.test.js`
- [x] T004 Actualizar `backend/src/services/reportingService.js` para que `obtenerUltimoDiaCompletado`/la fecha por defecto excluyan hoy y devuelvan el último día completado anterior
- [x] T005 [P] Añadir al contrato de `backend/tests/contract/reports_daily.test.js` el caso «hoy tiene cuentas cerradas, sin `date` → día anterior»
- [x] T006 Actualizar `backend/src/api/reportsRouter.js` para usar la fecha por defecto corregida y mantener el `400` solo para `date` explícito de hoy/futuro
- [x] T007 [P] Añadir pruebas de error del dashboard en `frontend/tests/components/dashboard_total.test.jsx` para distinguir red, `400/500` y `401/403`
- [x] T008 Actualizar `frontend/src/pages/PaginaDashboard.jsx` para mostrar un error del servidor real y reservar «sin conexión» para fallos de red

**Checkpoint**: la fecha por defecto y el tratamiento de errores son correctos y están cubiertos por pruebas.

---

## Phase 3: User Story 1 - Visión global de las ventas del servicio (Priority: P1) 🎯 MVP

**Goal**: mostrar el total del último día natural completado anterior a hoy, sin fallar tras cerrar una cuenta hoy.

**Independent Test**: cerrar una cuenta hoy, abrir `/dashboard` sin fecha y comprobar que muestra el día anterior; consultar explícitamente `?date=hoy` y comprobar `400`.

### Tests for User Story 1

- [x] T009 [P] [US1] Añadir integración de cierre de cuenta hoy y consulta sin fecha en `backend/tests/integration/reporting_fecha.test.js`
- [x] T010 [P] [US1] Añadir prueba de página de total y estado de error en `frontend/tests/components/dashboard_total.test.jsx`

### Implementation for User Story 1

- [x] T011 [US1] Ajustar `frontend/src/pages/PaginaDashboard.jsx` y `frontend/src/services/reports.js` para consumir la fecha por defecto y mostrar el error correcto
- [x] T012 [US1] Añadir el escenario E11 y la comprobación del total por defecto a `specs/007-dashboard-estadisticas/quickstart.md`

**Checkpoint**: el total y la fecha por defecto funcionan de forma independiente.

---

## Phase 4: User Story 2 - Desglose por camarero y por plato (Priority: P1)

**Goal**: mantener los desgloses alineados con la misma fecha por defecto corregida.

**Independent Test**: con cuentas cerradas ayer y hoy, el dashboard muestra los desgloses de ayer, no los parciales de hoy.

### Tests for User Story 2

- [x] T013 [P] [US2] Ampliar `backend/tests/contract/reports_breakdowns.test.js` con el caso de fecha por defecto anterior a hoy
- [x] T014 [P] [US2] Actualizar `frontend/tests/components/dashboard_breakdowns.test.jsx` para comprobar que los desgloses usan la fecha mostrada

### Implementation for User Story 2

- [x] T015 [US2] Revisar y ajustar `backend/src/services/reportingService.js` y `backend/src/api/reportsRouter.js` para que `porCamarero` y `porPlato` usen la misma fecha resuelta que el total

**Checkpoint**: los desgloses no mezclan días ni incluyen datos parciales.

---

## Phase 5: User Story 3 - Comparación con días anteriores (Priority: P2)

**Goal**: comparar el día mostrado con su día natural anterior, incluido el caso sin base de comparación.

**Independent Test**: con ventas ayer y cuentas cerradas hoy, el dashboard sigue comparando ayer con anteayer; no usa hoy como día actual.

### Tests for User Story 3

- [x] T016 [P] [US3] Ampliar `backend/tests/contract/reports_comparison.test.js` con la fecha por defecto corregida
- [x] T017 [P] [US3] Actualizar `frontend/tests/components/dashboard_comparison.test.jsx` y `frontend/tests/components/dashboard_comparison_zero_base.test.jsx` para la fecha mostrada
- [x] T018 [P] [US3] Mantener la integración de base cero en `backend/tests/integration/reporting_zero_base.test.js`

### Implementation for User Story 3

- [x] T019 [US3] Revisar y ajustar `backend/src/services/reportingService.js` para que la comparación use la fecha resuelta y no el día en curso

**Checkpoint**: la comparación es consistente con el total y los desgloses.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentación, regresión y validación final.

- [x] T020 [P] Actualizar `README.md` y `specs/007-dashboard-estadisticas/quickstart.md` con la regla de fecha y los estados de error
- [x] T021 [P] Revisar `specs/007-dashboard-estadisticas/plan.md` y `tasks.md` para eliminar referencias obsoletas a `x-usuario-id`, `RutaEncargado` y `services/sesion.js`
- [x] T022 Ejecutar las suites completas de `backend/tests/` y `frontend/tests/`, y corregir regresiones
- [x] T023 Ejecutar los escenarios E1–E11 de `specs/007-dashboard-estadisticas/quickstart.md` y registrar el resultado en `specs/007-dashboard-estadisticas/verification.md`
- [x] T024 Verificar que el flujo de cierre de la historia 006 puede cerrar una cuenta hoy sin romper el dashboard y que el dashboard ignora ese día hasta mañana

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup y bloquea las historias.
- **US1 (Phase 3)**: depende de Foundational; es el MVP.
- **US2 (Phase 4)**: depende de Foundational y del total de US1.
- **US3 (Phase 5)**: depende de Foundational y de los datos de US1/US2.
- **Polish (Phase 6)**: depende de las historias implementadas.

### User Story Dependencies

- **US1**: independiente; entrega el total y el estado de error correcto.
- **US2**: reutiliza la fecha resuelta por US1.
- **US3**: reutiliza la fecha y los desgloses de US1/US2.

### Parallel Opportunities

- T001/T002, T003/T005, T007/T009/T010, T013/T014, T016/T017/T018 y T020/T021 pueden ir en paralelo.
- No paralelizar tareas que modifiquen `backend/src/services/reportingService.js`, `backend/src/api/reportsRouter.js` o `frontend/src/pages/PaginaDashboard.jsx`.
- Las pruebas de cada historia se escriben antes de su implementación.

## Parallel Example: User Story 1

```bash
# Pruebas en paralelo:
Task: "Integración de cierre de hoy y fecha por defecto en backend/tests/integration/reporting_fecha.test.js"
Task: "Página de total y error en frontend/tests/components/dashboard_total.test.jsx"
```

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Setup y Foundational.
2. Corregir la fecha por defecto y el estado de error de la página.
3. Validar el escenario E11: cerrar una cuenta hoy y comprobar que el dashboard muestra ayer.
4. Continuar con US2 y US3.

### Incremental Delivery

1. Fecha por defecto y regresión de hoy.
2. Total y estados de la página.
3. Desgloses y comparación sobre la misma fecha.
4. Documentación y validación E1–E11.

## Notes

- El día en curso nunca se muestra como parcial.
- `?date=hoy` sigue siendo `400`; solo la ausencia de `date` usa el día anterior completado.
- No se debe mostrar «sin conexión» para un `400` o `500` del servidor.
- No se modifica la lógica de cierre de cuentas de la historia 006.

## Phase 7: Convergence

- [x] T025 Sustituir las agrupaciones `DATE(cerrada_en, 'localtime')` de `backend/src/services/reportingService.js` por una conversión explícita a Europe/Madrid basada en `limitesDelDia`, y añadir una prueba con `TZ=UTC` que cubra un cierre en la madrugada, per FR-001/plan D2 (partial)

## Phase 8: Convergence

- [x] T026 Implementar la comparación por camarero y por plato en `backend/src/services/reportingService.js` y mostrarla en `frontend/src/pages/PaginaDashboard.jsx`, con pruebas de contrato y componente, per FR-010/US3/AC5 (missing)
- [x] T027 Incluir a los camareros y platos sin ventas con `0,00 €` en los desgloses del servicio y de la página, con pruebas en `backend/tests/contract/reports_breakdowns.test.js` y `frontend/tests/components/dashboard_breakdowns.test.jsx`, per FR-003/FR-004/US2/AC3 (partial)
- [x] T028 Devolver `comparacion.diaAnterior = null` y mostrar «sin datos anteriores» cuando no exista ningún día anterior, con pruebas en `backend/tests/contract/reports_comparison.test.js` y `frontend/tests/components/dashboard_comparison.test.jsx`, per FR-007/US3/AC4 (missing)
- [x] T029 Corregir la agregación por plato para vincular consumos y cuentas mediante `cuentas.pedido_id` y evitar duplicados en mesas reutilizadas, con prueba de dos cuentas sobre la misma mesa, en `backend/src/services/reportingService.js` y `backend/tests/contract/reports_breakdowns.test.js`, per FR-004/SC-004/plan: cuenta–pedido (contradicts)

## Phase 9: Convergence

- [x] T030 Vincular las cuentas históricas del seed a pedidos y consumos mediante `cuentas.pedido_id`, para que el dashboard sembrado no muestre totales con desglose por plato a cero, y añadir la comprobación correspondiente en `backend/src/db/seed.js` y `backend/tests/contract/reports_breakdowns.test.js`, per FR-004/US2/AC2 (partial)
