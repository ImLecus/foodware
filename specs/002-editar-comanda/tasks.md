---
description: "Task list for feature 002-editar-comanda"
---

# Tasks: Editar un pedido enviado

**Input**: Design documents from `/specs/002-editar-comanda/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Base**: esta historia se construye sobre la aplicación creada en la historia 001 (mismo stack,
`docker-compose.yml`, `backend/` y `frontend/`). No se inicializa proyecto de nuevo.

**Tests**: INCLUIDAS — la constitución exige pruebas automatizadas para toda funcionalidad. Se
escriben junto al desarrollo y deben fallar antes de implementar.

**Organization**: Una sola historia de usuario (US1, P1). Fases: Setup → Foundational → US1 → Polish.

**Flujo de trabajo**: Cada tarea completada se **detiene** para que el usuario la revise y haga su
commit (constitución: parada por tarea; Conventional Commits). Tareas `[P]` son paralelizables
(ficheros distintos, sin dependencias), pero se confirman igualmente una a una.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias pendientes)
- **[Story]**: `[US1]` en las tareas de la historia de usuario
- Todas las tareas incluyen rutas de fichero exactas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar la base de la 001 para poder editar pedidos enviados.

- [ ] T001 [P] Ampliar el seed con un pedido ya enviado de ejemplo (con al menos una partida) en `backend/src/db/seed.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Esquema y piezas base que bloquean la implementación de la historia.

**⚠️ CRITICAL**: Ninguna tarea de US1 puede empezar hasta completar esta fase.

- [ ] T002 Crear la migración SQL de la edición (columnas `modificada`, `cambios_pendientes`, `cambios_enviados_en`, `editando_por`, `editando_desde` en `pedido`; valor `cerrada` en el estado de `pedido`; `indicaciones` en `linea_pedido`; tabla `modificacion`) en `backend/migrations/`
- [ ] T003 Ampliar el repositorio de pedidos con estado `cerrada`, `modificada`, `cambios_pendientes` y bloqueo (`editando_por`/`editando_desde`) en `backend/src/db/pedidos.js`
- [ ] T004 Implementar el repositorio de modificaciones (registro append-only) en `backend/src/db/modificaciones.js`
- [ ] T005 Implementar el middleware de comprobación del bloqueo de edición en `backend/src/api/middleware/bloqueo.js`

**Checkpoint**: Base lista — puede comenzar la historia US1.

---

## Phase 3: User Story 1 - Editar un pedido ya enviado (Priority: P1) 🎯 MVP

**Goal**: El camarero edita directamente un pedido enviado (añadir, retirar, ajustar cantidad,
corregir indicaciones) sin crear otra; el pedido queda marcado como modificado y vinculada a la
misma mesa, con bloqueo de edición y una acción explícita "enviar cambios" hacia cocina.

**Independent Test**: enviar un pedido, editarla, comprobar que los cambios quedan sobre la misma
pedido marcado como modificado y vinculada a la misma mesa, que no se comunican solos y que el
bloqueo impide la edición simultánea (ver `quickstart.md`, escenarios 1–12).

### Tests for User Story 1 (write first, ensure they FAIL) ⚠️

- [ ] T006 [P] [US1] Prueba de API del bloqueo de edición (423 si está ocupada) y su liberación en `backend/tests/edicion.bloqueo.test.js`
- [ ] T007 [P] [US1] Prueba de API de añadir/retirar/ajustar líneas sobre pedido enviado y del 409 al dejar el pedido vacío en `backend/tests/edicion.lineas.test.js`
- [ ] T008 [P] [US1] Prueba de API de marcado como modificada, de no marcar sin cambios y del 409 al editar pedido no editable (cerrada) en `backend/tests/edicion.estado.test.js`
- [ ] T009 [P] [US1] Prueba de API de `enviar-cambios` explícito (0 envíos automáticos al guardar) en `backend/tests/edicion.enviar-cambios.test.js`
- [ ] T010 [P] [US1] Pruebas de UI del editor de pedido (editar, marcar como modificado, enviar cambios y aviso de bloqueo) en `frontend/tests/edicion.test.jsx`

### Implementation for User Story 1

- [ ] T011 [US1] Dominio de edición: reglas (solo pedido `enviada`, no vacío, marcar como modificado, cambios pendientes) en `backend/src/domain/edicion.js`
- [ ] T012 [US1] Esquemas de validación zod de la edición en `backend/src/schemas/edicion.js`
- [ ] T013 [US1] Endpoints de bloqueo `POST /pedidos/{id}/editar` y `DELETE /pedidos/{id}/editar` en `backend/src/api/pedidos.js`
- [ ] T014 [US1] Ampliar los endpoints de líneas para admitir pedidos enviados (añadir/modificar/retirar) en `backend/src/api/pedidos.js`
- [ ] T015 [US1] Endpoint `POST /pedidos/{id}/enviar-cambios`, que publica el cambio por SSE, en `backend/src/api/pedidos.js`
- [ ] T016 [US1] Registrar cada cambio en la tabla de modificaciones (FR-013) en `backend/src/domain/edicion.js`
- [ ] T017 [US1] Ampliar `GET /pedidos/{id}` con `modificada`, `cambios_pendientes` y estado de bloqueo en `backend/src/api/pedidos.js`
- [ ] T018 [P] [US1] Componente editor de pedido enviado en `frontend/src/components/EditorPedido.jsx`
- [ ] T019 [P] [US1] Componente de la acción "Enviar cambios" en `frontend/src/components/EnviarCambios.jsx`
- [ ] T020 [US1] Aviso de bloqueo (pedido en edición por otro camarero) en `frontend/src/components/EditorPedido.jsx`
- [ ] T021 [US1] Cliente de API de edición, bloqueo, enviar-cambios y suscripción SSE en `frontend/src/services/api.js` y `frontend/src/services/realtime.js`
- [ ] T022 [US1] Marca visual de "modificada" y "cambios pendientes" en `frontend/src/components/EditorPedido.jsx`

**Checkpoint**: US1 funcional y verificable de forma independiente (MVP).

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Mejoras y validación final.

- [ ] T023 [P] Documentar en `README.md` la edición de pedidos y enlazar `specs/002-editar-comanda/quickstart.md`
- [ ] T024 Ejecutar la validación manual de `specs/002-editar-comanda/quickstart.md` (escenarios 1–12) y corregir lo necesario
- [ ] T025 [P] Revisar los textos en español de España y el formato de moneda en la UI de edición
- [ ] T026 Ejecutar la suite completa (`docker compose run --rm backend npm test` y `frontend npm test`) y dejar todo en verde

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: depende de la base de la historia 001.
- **Foundational (Phase 2)**: depende de Setup; BLOQUEA la historia US1.
- **User Story 1 (Phase 3)**: depende de Foundational.
- **Polish (Phase 4)**: depende de US1 completa.

### Within User Story 1

- Las pruebas (T006–T010) se escriben primero y deben fallar antes de implementar.
- El dominio (T011) y los esquemas (T012) antes de los endpoints (T013–T017).
- T016 depende de T004 y T011.
- T020 y T022 dependen de T018 (mismo fichero, no paralelizables).
- El frontend (T018–T022) puede avanzar en paralelo al backend una vez definido el contrato
  (`contracts/openapi.yaml`).

### Parallel Opportunities

- T006–T010 en paralelo (ficheros de prueba distintos).
- T018 y T019 en paralelo (ficheros distintos).
- T023 y T025 en paralelo.

---

## Parallel Example: User Story 1

```bash
# Pruebas de US1 (escribir primero, deben fallar):
Task: "T006 [US1] Prueba de bloqueo en backend/tests/edicion.bloqueo.test.js"
Task: "T007 [US1] Prueba de líneas y pedido vacío en backend/tests/edicion.lineas.test.js"
Task: "T008 [US1] Prueba de estado/modificada en backend/tests/edicion.estado.test.js"
Task: "T009 [US1] Prueba de enviar-cambios en backend/tests/edicion.enviar-cambios.test.js"
Task: "T010 [US1] Pruebas de UI del editor en frontend/tests/edicion.test.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Completar Phase 1 (Setup).
2. Completar Phase 2 (Foundational).
3. Completar Phase 3 (US1).
4. **PARAR y VALIDAR**: probar US1 con `quickstart.md` antes de seguir.
5. Desplegar/demostrar si procede.

### Parada por tarea (constitución)

Tras completar cada tarea, el agente se detiene, resume lo hecho y espera a que el usuario la
revise y haga el commit (Conventional Commits) antes de continuar con la siguiente.

---

## Notes

- `[P]` = ficheros distintos, sin dependencias.
- Las pruebas se escriben primero y deben fallar antes de implementar.
- Un commit por tarea (Conventional Commits).
- Depende de la historia 001 (pedido enviado); la toma inicial de pedidos no se repite aquí.
- Fuera de alcance: cocina (003), marcar listos (004), señales (005), cierre de cuenta (006),
  dashboard (007) y gestión de carta (008).
