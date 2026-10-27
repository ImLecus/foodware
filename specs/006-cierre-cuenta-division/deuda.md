# Deuda técnica de la historia 006

Registro de desviaciones e inconsistencias detectadas en `/speckit.analyze` (2026-10-27) que
se aplazan para una sesión específica de corrección. No forman parte del alcance funcional de
la historia: aquí solo se anotan para no perderlas.

## Decisiones tomadas durante la implementación

- **API en `snake_case` y con identificadores de texto** (`mesa-1`, UUID), coherente con las
  historias 001–005. Los contratos de `contracts/api.md` usan `camelCase` e ids numéricos y
  quedan pendientes de adaptación.
- **Hub SSE real**: `GET /api/eventos` (no `/api/sala/eventos`).
- **Cierre de mesa**: `mesas.estado = 'cerrada'` (no existe la columna `abierta`).
- **Ticket**: se compone a partir de la cuenta cerrada y sus partes; no se persiste una tabla
  propia (la tabla `tickets` de `001_init.sql` queda sin uso en v1).

## Hallazgos pendientes

| ID | Severidad | Descripción | Ficheros afectados |
|----|-----------|-------------|--------------------|
| I2 | Crítica | `cuentas` no tenía `modo_division`; se añade en la migración 004. Falta decidir si `unico` se persiste o queda nulo. | `backend/migrations/004_cuentas.sql`, `data-model.md` |
| I1 | Alta | La división figura en `POST /cuenta/division` (contrato/plan) y dentro de `POST /cuenta/cierre` (tasks). Se implementará el endpoint separado. | `contracts/api.md`, `plan.md`, `tasks.md` |
| I3 | Alta | El ticket es derivado según research/data-model, pero existe la tabla `tickets`. Decidir si se elimina o se usa. | `001_init.sql`, `data-model.md`, `tasks.md` |
| I4 | Alta | T047 habla de `abierta = false`; el esquema usa `estado = 'cerrada'`. Corregir la tarea. | `tasks.md`, `001_init.sql` |
| U1 | Alta | T001–T011 apuntan a rutas inexistentes y duplican infraestructura ya construida. Reconciliar con el repo. | `tasks.md`, `plan.md` |
| U2 | Alta | Falta tarea para montar `cuentasRouter` en `app.js`. | `tasks.md`, `backend/src/app.js` |
| U3 | Alta | Falta tarea para sustituir `ModuloPendiente` de `/cuentas` en `App.jsx` y actualizar `App.test.jsx`. | `tasks.md`, `frontend/src/App.jsx` |
| U4 | Alta | FR-012: `POST /api/mesas/:id/abrir` no rechaza mesas cerradas; puede reabrirlas. | `backend/src/routes/mesas.js` |
| U5 | Media | T018 crea `services/formato.js` cuando ya existe `utils/formato.js`. | `tasks.md`, `frontend/src/utils/formato.js` |
| I5 | Media | El contrato cita `/api/sala/eventos`; el hub real es `/api/eventos`. | `contracts/api.md` |
| I6 | Media | Deriva de nombres: contrato `camelCase`, data-model `importe_cent`, esquema `importe_centimos`. | varios |
| I7 | Media | No hay restricción de una sola cuenta abierta por mesa. | `backend/migrations/004_cuentas.sql` |
| G1 | Media | El contrato pide que la sala reaccione a `mesa-cerrada`; falta la tarea de frontend. | `frontend/src/services/realtime.js`, `Mesas.jsx`, `SalaEstado.jsx` |
| I8 | Media | Falta el caso `409` de división ya confirmada con partes pagadas en T025/T029. | `tasks.md` |
| I9 | Baja | `cuenta_id` aparece en la asignación del data-model pero no en `cuentas_parte_consumos`. | `data-model.md`, `001_init.sql` |
| C1 | Media | La rama actual (`feat/cierre-cuenta`) no sigue `feature/*` de la constitución. | rama Git |
| D1 | Baja | T039 y T042 escriben el mismo fichero de test. | `tasks.md` |
