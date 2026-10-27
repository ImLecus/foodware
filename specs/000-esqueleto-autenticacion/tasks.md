---
description: "Task list for feature 000-esqueleto-autenticacion"
---

# Tasks: Esqueleto del proyecto y autenticación por roles

**Input**: Design documents from `/specs/000-esqueleto-autenticacion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Incluidas. La constitución exige pruebas automatizadas por funcionalidad; las tareas de
prueba se escriben antes de su implementación y deben fallar inicialmente.

**Organization**: Tareas agrupadas por historia: US1 (base existente), US2 (login/sesión), US3
(roles y guards) y US4 (credenciales demo).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo (ficheros distintos, sin dependencias)
- **[Story]**: US1, US2, US3 o US4
- Cada tarea incluye la ruta exacta del fichero

## Path Conventions

Aplicación web: `backend/src/`, `backend/tests/`, `frontend/src/`, `frontend/tests/`, `backend/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configuración e infraestructura de autenticación compartida.

- [x] T001 Añadir la configuración de sesión a `backend/src/config.js` y `backend/.env.example`: `SESSION_TTL_MINUTES`, `SESSION_COOKIE_NAME` y `SESSION_COOKIE_SECURE`
- [x] T002 [P] Crear la migración `backend/migrations/006_auth.sql` con `usuarios.password_hash`, la tabla `sesiones` y sus índices
- [x] T003 [P] Crear el helper de autenticación de pruebas en `backend/tests/helpers/auth.js` (crear usuario, sesión y cookie)
- [x] T004 [P] Crear el helper de render autenticado en `frontend/tests/helpers/auth.jsx` (AuthProvider y rol simulado solo en tests)

**Checkpoint**: configuración, migración y helpers listos.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Utilidades compartidas por login y guards.

**⚠️ CRITICAL**: US2 y US3 dependen de estas tareas.

- [x] T005 [P] Pruebas unitarias de hash y verificación de contraseñas en `backend/tests/unit/auth-password.test.js`
- [x] T006 [P] Pruebas unitarias de sesiones, renovación y caducidad en `backend/tests/unit/auth-sesiones.test.js`
- [x] T007 Implementar hash y verificación de contraseñas con `scrypt` en `backend/src/auth/password.js`
- [x] T008 Implementar lectura/escritura de cookies de sesión en `backend/src/auth/cookies.js`
- [x] T009 Implementar el almacén de sesiones (crear, buscar, renovar, revocar y limpiar caducadas) en `backend/src/auth/sesiones.js`
- [x] T010 Implementar el middleware `autenticar` que convierte la cookie en `req.usuario` en `backend/src/middleware/autenticar.js`

**Checkpoint**: base de criptografía, cookies, sesiones y autenticación lista.

---

## Phase 3: User Story 1 - Base compartida del proyecto (Priority: P1)

**Goal**: Documentar y verificar la base que ya existe: monorepo, Docker, SQLite, seed, frontend,
SSE, pruebas y README.

**Independent Test**: desde un clon limpio, arrancar con Docker, ejecutar el seed y comprobar que
frontend, API y suites funcionan.

### Implementation for User Story 1

- [x] T011 [P] [US1] Verificar y documentar la estructura del monorepo y el arranque Docker en `README.md` y `specs/000-esqueleto-autenticacion/quickstart.md`
- [x] T012 [P] [US1] Verificar que el seed crea partidas, usuarios, mesas, platos, pedidos y cuentas de ejemplo, y reflejar los conteos en `specs/000-esqueleto-autenticacion/verification.md`
- [x] T013 [US1] Ejecutar las suites existentes de `backend/` y `frontend/` y corregir cualquier regresión de la base documentada

**Checkpoint**: la base existente queda documentada y verificada.

---

## Phase 4: User Story 2 - Login, sesión y logout (Priority: P1) 🎯 MVP

**Goal**: permitir el acceso con usuario y contraseña, mantener la sesión al recargar y cerrar
sesión de forma segura.

**Independent Test**: entrar con un usuario demo, recargar y comprobar que sigue autenticado;
cerrar sesión y comprobar que vuelve al acceso y que una ruta protegida da `401`.

### Tests for User Story 2 ⚠️

- [x] T014 [P] [US2] Pruebas de contrato de `POST /api/auth/login`, `GET /api/auth/me` y `POST /api/auth/logout` en `backend/tests/contract/auth.test.js`
- [x] T015 [P] [US2] Prueba de integración de persistencia de sesión, recarga y logout en `backend/tests/integration/auth-sesion.test.js`
- [x] T016 [P] [US2] Pruebas de componente de login, error genérico, sesión persistente y logout en `frontend/tests/auth/LoginPage.test.jsx` y `frontend/tests/auth/Sesion.test.jsx`

### Implementation for User Story 2

- [x] T017 [US2] Conectar `password.js`, `cookies.js` y `sesiones.js` con la migración y la configuración de sesión
- [x] T018 [US2] Implementar las rutas `login`, `me` y `logout` en `backend/src/routes/auth.js`
- [x] T019 [US2] Registrar el router de autenticación y configurar CORS con credenciales y cookie en `backend/src/app.js`
- [x] T020 [US2] Implementar `AuthContext` y la carga inicial de `/api/auth/me` en `frontend/src/auth/AuthContext.jsx` y `frontend/src/main.jsx`
- [x] T021 [US2] Implementar la pantalla de login con errores en español en `frontend/src/pages/LoginPage.jsx`
- [x] T022 [US2] Actualizar el cliente HTTP para enviar cookies (`credentials: include`) y añadir las funciones de login, me y logout en `frontend/src/services/api.js`
- [x] T023 [US2] Mostrar usuario, rol y botón de logout en `frontend/src/components/UsuarioMenu.jsx` y `frontend/src/App.jsx`
- [x] T024 [US2] Gestionar sesión caducada y `401` redirigiendo al login en `frontend/src/auth/AuthContext.jsx` y `frontend/src/services/api.js`

**Checkpoint**: login, persistencia y logout funcionan de forma independiente.

---

## Phase 5: User Story 3 - Acceso por rol (Priority: P1)

**Goal**: aplicar la matriz de permisos en páginas, APIs y canales SSE; eliminar la identidad
simulada.

**Independent Test**: entrar con cada rol y comprobar que solo accede a sus módulos; las rutas y
APIs de otros roles devuelven `403` o acceso denegado.

### Tests for User Story 3 ⚠️

- [x] T025 [P] [US3] Pruebas de contrato de `401`/`403` y matriz de roles en `backend/tests/contract/auth-roles.test.js`
- [x] T026 [P] [US3] Pruebas de integración de acceso directo por URL/API y ausencia de identidad por cabecera/query en `backend/tests/integration/auth-roles.test.js`
- [x] T027 [P] [US3] Pruebas de componente de `RutaProtegida`, menú por rol y acceso denegado en `frontend/tests/auth/RutaProtegida.test.jsx` y `frontend/tests/auth/MenuRol.test.jsx`

### Implementation for User Story 3

- [x] T028 [US3] Implementar `requireRole` sobre `req.usuario` de la sesión en `backend/src/middleware/authorize.js`
- [x] T029 [US3] Proteger con sesión y rol las rutas de `backend/src/app.js`, `routes/mesas.js`, `routes/pedidos.js`, `routes/sala.js`, `routes/platos.js`, `routes/cocineros.js`, `routes/partidas.js`, `routes/events.js` y `api/reportsRouter.js`
- [x] T030 [US3] Eliminar `X-Camarero-Id`, `x-usuario-id`, `VITE_CAMARERO_ID`, `VITE_USUARIO_ID`, `VITE_ROL` y `?cocinero=` como fuentes de identidad en `backend/src/middleware/camarero.js`, `frontend/src/services/api.js` y `frontend/src/services/sesion.js`
- [x] T031 [US3] Exigir sesión y rol en los canales SSE y configurar `withCredentials` en `backend/src/routes/events.js`, `backend/src/routes/partidas.js`, `backend/src/routes/mesas.js`, `frontend/src/services/realtime.js` y `frontend/src/services/events.js`
- [x] T032 [US3] Implementar `RutaProtegida`, inicio por rol y menú filtrado en `frontend/src/components/RutaProtegida.jsx`, `frontend/src/auth/rutas.js` y `frontend/src/App.jsx`
- [x] T033 [US3] Adaptar la cocina para obtener cocinero y partida de la sesión, sin `obtenerCocinero` ni `?cocinero=`, en `frontend/src/pages/CocinaPage.jsx` y `frontend/src/services/api.js`
- [x] T034 [US3] Adaptar sala, mesas, dashboard y administración a la sesión y a los guards de rol en `frontend/src/pages/Mesas.jsx`, `frontend/src/pages/SalaEstado.jsx`, `frontend/src/pages/PaginaDashboard.jsx`, `frontend/src/pages/SalaPage.jsx`, `frontend/src/components/RutaProtegida.jsx`, `frontend/src/auth/rutas.js` y `frontend/src/App.jsx`
- [x] T035 [US3] Actualizar los tests de backend de las historias 001–008 (008 aún sin suite propia) para autenticarse con cookie de sesión en `backend/tests/**`
- [x] T036 [US3] Actualizar los tests de frontend de las historias 001–008 (008 aún sin suite propia) para montar `AuthProvider` y respetar los guards en `frontend/tests/**`
- [x] T037 [US3] Sustituir las pruebas de identidad por cabecera de `backend/tests/camarero.test.js` y `backend/tests/unit/authorize.test.js` por pruebas de sesión y rol

**Checkpoint**: cada rol accede solo a sus módulos y APIs.

---

## Phase 6: User Story 4 - Credenciales de demostración (Priority: P2)

**Goal**: disponer de usuarios demo con credenciales conocidas y no productivas para validar login
y permisos.

**Independent Test**: con una base sembrada, iniciar sesión con un usuario de cada rol usando la
contraseña demo documentada.

### Tests for User Story 4 ⚠️

- [x] T038 [P] [US4] Prueba de integración de login demo para todos los roles y partidas en `backend/tests/integration/auth-demo.test.js`
- [x] T039 [P] [US4] Prueba de componente o smoke de las credenciales demo en `frontend/tests/auth/CredencialesDemo.test.jsx`

### Implementation for User Story 4

- [x] T040 [US4] Actualizar `backend/src/db/seed.js` para calcular `password_hash` de `demo1234` y actualizar los usuarios demo existentes
- [x] T041 [US4] Documentar usuarios, roles, partidas y contraseña demo en `specs/000-esqueleto-autenticacion/quickstart.md` y `README.md`
- [x] T042 [US4] Verificar que `backend/src/db/seed.js` mantiene un cocinero por partida, un cocinero sin partida y los roles encargado/administrador

**Checkpoint**: los usuarios demo permiten validar login y permisos desde el primer arranque.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: verificación final, seguridad y documentación.

- [x] T043 [P] Crear el mapa de FR-001…FR-030 y SC-001…SC-010 a pruebas en `specs/000-esqueleto-autenticacion/verification.md`
- [x] T044 [P] Añadir pruebas de seguridad de cookies, CORS, errores genéricos y ausencia de secretos en `backend/tests/contract/auth-seguridad.test.js`
- [x] T045 Actualizar README y quickstart con el arranque autenticado, la matriz de roles y la retirada de identidades simuladas en `README.md` y `specs/000-esqueleto-autenticacion/quickstart.md`
- [x] T046 Ejecutar las suites completas de `backend/tests/` y `frontend/tests/`, corregir regresiones y confirmar que las historias 001–008 siguen funcionando con sesión real
- [x] T047 Ejecutar `specs/000-esqueleto-autenticacion/quickstart.md` de principio a fin: login, persistencia, logout, 401, 403 y cada rol
- [x] T048 Revisar que no queden referencias a `X-Camarero-Id`, `x-usuario-id`, `VITE_ROL`, `VITE_CAMARERO_ID`, `VITE_USUARIO_ID` ni `?cocinero=` en `backend/src/`, `frontend/src/`, `backend/tests/` o `frontend/tests/`
- [x] T049 Revisar que no haya contraseñas en claro, secretos reales ni tokens en logs o respuestas en `backend/src/`, `frontend/src/` y `backend/src/db/seed.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup y bloquea US2/US3.
- **US1 (Phase 3)**: puede ejecutarse en paralelo con Setup/Foundational; es verificación/documentación.
- **US2 (Phase 4)**: depende de Foundational.
- **US3 (Phase 5)**: depende de US2 (necesita sesión).
- **US4 (Phase 6)**: depende de Foundational y de US2 para validar login.
- **Polish (Phase 7)**: depende de US1–US4.

### User Story Dependencies

- **US1**: independiente; documenta la base existente.
- **US2**: requiere migración, password, sesiones y middleware.
- **US3**: requiere login/sesión y `requireRole`.
- **US4**: requiere seed y login.

### Within Each User Story

- Tests antes de implementación.
- Modelo/migración antes de servicios.
- Servicios antes de rutas/UI.
- Guards de backend antes de pruebas de regresión de las historias existentes.
- No ejecutar en paralelo tareas que modifiquen `backend/src/app.js`, `frontend/src/App.jsx`, `frontend/src/services/api.js` o `frontend/src/pages/CocinaPage.jsx`.

### Parallel Opportunities

- T002/T003/T004 en paralelo.
- T005/T006 pueden ir en paralelo; T007–T010 implementan las utilidades tras los tests.
- T014–T016 y T005/T006 en paralelo.
- T025–T027 en paralelo.
- T038–T039 en paralelo.
- T043/T044 en paralelo.
- Backend y frontend de US2/US3 pueden avanzar en paralelo una vez compartidos los contratos.

---

## Parallel Example: User Story 2

```bash
# Tests en paralelo:
Task: "Pruebas unitarias de contraseñas en backend/tests/unit/auth-password.test.js"
Task: "Pruebas unitarias de sesiones en backend/tests/unit/auth-sesiones.test.js"
Task: "Pruebas de contrato de auth en backend/tests/contract/auth.test.js"
Task: "Pruebas de sesión en frontend/tests/auth/Sesion.test.jsx"
Task: "Pruebas de login en frontend/tests/auth/LoginPage.test.jsx"
```

---

## Implementation Strategy

### MVP First

1. Completar Setup y Foundational.
2. Completar US1 (verificación/documentación de la base).
3. Completar US2: login, sesión persistente y logout.
4. **PARAR y VALIDAR** login/sesión con el quickstart.
5. Completar US3 para aplicar permisos y eliminar la identidad simulada.
6. Completar US4 y Polish.

### Incremental Delivery

1. Base documentada + migración + utilidades.
2. Login/sesión/logout.
3. Guards y matriz de roles.
4. Credenciales demo.
5. Regresión completa de las historias 001–008.

### Parallel Team Strategy

- Una persona: backend de auth (T007–T010, T017–T019, T028–T031).
- Una persona: frontend de auth (T020–T024, T032–T034).
- Una persona: pruebas y adaptación de suites existentes (T005–T006, T014–T016, T025–T027, T035–T039).
- Una persona: seed, documentación y verificación (T001–T004, T040–T049).

---

## Notes

- La contraseña demo `demo1234` es local y no productiva.
- Los tests actuales que usan cabeceras de identidad deben migrarse a cookies de sesión.
- No se debe conservar ningún bypass de autenticación en producción.
- La gestión completa de carta sigue en la historia 008; aquí solo se protege su acceso.
- La reutilización de mesas cerradas y el dashboard pertenecen a 006/007.
- Commit después de cada tarea o grupo lógico.

## Phase 8: Convergence

- [x] T050 Rechazar con `403` las peticiones de escritura cuyo `Origin` no coincida con `CORS_ORIGIN`, antes de ejecutar la operación, y añadir pruebas de preflight y de que una sesión válida no muta datos desde un origen ajeno per FR-029/US3/AC7 (partial)
- [x] T051 Añadir una prueba de frontend que simule un `401` durante una operación protegida y verifique que `AuthContext` retira la sesión y la aplicación vuelve al login per FR-013/US2/AC6 (partial)
