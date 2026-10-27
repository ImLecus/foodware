# Tareas: Gestión de la carta

**Entrada**: Documentos de diseño en `specs/008-gestion-carta/`

**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/

**Pruebas**: incluidas; la constitución exige pruebas automatizadas por funcionalidad.

**Organización**: tareas agrupadas por historia de usuario para permitir implementación y prueba
independientes.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: puede ejecutarse en paralelo (ficheros distintos, sin dependencias pendientes)
- **[Story]**: historia de usuario a la que pertenece (US1, US2, US3)
- Cada tarea incluye la ruta exacta del fichero afectado

## Convenciones de rutas

- **Aplicación web**: `backend/src/`, `frontend/src/`, pruebas en `backend/tests/` y
  `frontend/tests/`.

---

## Fase 1: Setup (infraestructura compartida)

**Propósito**: inicialización del proyecto y estructura básica.

- [X] T001 Crear la estructura de carpetas `backend/` y `frontend/` según `plan.md`
- [X] T002 [P] Inicializar el backend (JavaScript, Express, better-sqlite3, zod) en `backend/package.json`
- [X] T003 [P] Inicializar el frontend (React 18, Vite, JavaScript, Chakra UI, React Router) en `frontend/package.json`
- [X] T004 [P] Configurar Vitest y Supertest en el backend en `backend/vitest.config.js`
- [X] T005 [P] Configurar Vitest y React Testing Library en el frontend en `frontend/vitest.config.js`
- [X] T006 [P] Configurar ESLint y Prettier en `backend/.eslintrc.cjs` y `frontend/.eslintrc.cjs`
- [X] T007 Crear `backend/Dockerfile`, `frontend/Dockerfile` y el `docker-compose.yml` raíz

---

## Fase 2: Fundacional (prerrequisitos bloqueantes)

**Propósito**: infraestructura que MUST estar lista antes de cualquier historia.

**⚠️ CRÍTICO**: ninguna historia puede empezar hasta completar esta fase.

- [X] T008 Crear el esquema SQLite (`plato`, `ingrediente`, `plato_ingrediente`) en `backend/db/schema.sql`
- [X] T009 Crear la migración que garantiza las tablas `ingrediente` y `plato_ingrediente` (claves foráneas y par único) sobre bases existentes en `backend/db/migrations/002-ingredientes.sql`
- [X] T010 [P] Crear el script de datos semilla (platos e ingredientes) en `backend/db/seed.js`
- [X] T011 Implementar modelos y acceso a datos `Plato`, `Ingrediente`, `PlatoIngrediente` en `backend/src/models/carta.js`
- [X] T012 [P] Implementar middleware de autorización por rol `requireRole` en `backend/src/middleware/authorize.js`
- [X] T013 [P] Definir esquemas de validación zod (plato e ingrediente) en `backend/src/api/cartaSchemas.js`
- [X] T014 Implementar el cálculo de disponibilidad derivada (`ofrecible`/`motivo`) en `backend/src/services/cartaService.js`
- [X] T015 Configurar el router de la API y el manejo de errores HTTP en `backend/src/api/index.js`
- [X] T016 [P] Crear el cliente HTTP de carta (`fetch`) en `frontend/src/services/cartaClient.js`
- [X] T017 [P] Crear la utilidad de formato de precio y número es-ES en `frontend/src/utils/format.js`

**Punto de control**: base lista; las historias pueden empezar.

---

## Fase 3: Historia de usuario 1 - Gestión del catálogo de platos (Priority: P1) 🎯 MVP

**Objetivo**: el administrador crea y modifica platos (nombre, partida, precio) con validación.

**Prueba independiente**: crear un plato nuevo y comprobar que aparece en la carta vigente.

### Pruebas de la US1 ⚠️

> **NOTA: escribir primero y comprobar que fallan antes de implementar**

- [X] T018 [P] [US1] Prueba de contrato de `GET/POST/PATCH /api/admin/platos` en `backend/tests/contract/carta-admin.test.js`
- [X] T019 [P] [US1] Prueba unitaria de validación de precio y partida en `backend/tests/unit/validacion-plato.test.js`
- [X] T020 [P] [US1] Prueba de componente del formulario de alta/edición en `frontend/tests/components/FormularioPlato.test.jsx`

### Implementación de la US1

- [X] T021 [US1] Implementar el alta de plato (`crearPlato`) y la validación de precio/partida en `backend/src/services/cartaService.js`
- [X] T022 [US1] Implementar la edición de plato (`actualizarPlato` de nombre/partida/precio) en `backend/src/services/cartaService.js`
- [X] T023 [US1] Implementar los endpoints `GET/POST/PATCH /api/admin/platos` en `backend/src/api/cartaAdminRouter.js`
- [X] T024 [US1] Crear el componente `FormularioPlato` (alta/edición, validación y avisos) en `frontend/src/components/FormularioPlato.jsx`
- [X] T025 [US1] Crear el componente `TablaPlatos` (nombre, partida, precio en €) en `frontend/src/components/TablaPlatos.jsx`
- [X] T026 [US1] Crear la página `PaginaGestionCarta` (carga, alta y edición) en `frontend/src/pages/PaginaGestionCarta.jsx`
- [X] T027 [US1] Registrar la ruta `/admin/carta` protegida por rol en `frontend/src/App.jsx`

**Punto de control**: la US1 es funcional y verificable de forma independiente.

---

## Fase 4: Historia de usuario 2 - Gestión de precios y disponibilidad (Priority: P1)

**Objetivo**: el administrador marca platos como disponibles/no disponibles y la carta de sala solo
ofrece los disponibles.

**Prueba independiente**: marcar un plato como no disponible y comprobar que desaparece de la carta
de sala.

### Pruebas de la US2 ⚠️

- [X] T028 [P] [US2] Prueba de contrato de `PATCH /api/admin/platos/:id` (`activo`) y `GET /api/carta` en `backend/tests/contract/carta-disponibilidad.test.js`
- [X] T029 [P] [US2] Prueba de integración de baja/alta manual sobre datos sembrados en `backend/tests/integration/disponibilidad-manual.test.js`
- [X] T030 [P] [US2] Prueba de componente del control de disponibilidad en `frontend/tests/components/TablaPlatos.test.jsx`

### Implementación de la US2

- [X] T031 [US2] Implementar el cambio de disponibilidad manual (`cambiarActivo`) en `backend/src/services/cartaService.js`
- [X] T032 [US2] Implementar el endpoint `GET /api/carta` (solo platos ofrecibles, agrupados por partida) en `backend/src/api/cartaRouter.js`
- [X] T033 [US2] Añadir el control activar/desactivar por fila en `frontend/src/components/TablaPlatos.jsx`
- [X] T034 [US2] Refrescar la disponibilidad en la página tras guardar un cambio en `frontend/src/pages/PaginaGestionCarta.jsx`

**Punto de control**: US1 y US2 funcionan de forma independiente.

---

## Fase 5: Historia de usuario 3 - Actualización automática por agotamiento de ingrediente (Priority: P2)

**Objetivo**: el administrador crea y edita ingredientes, los asocia a uno o varios platos y cambia
su estado; al poner un ingrediente a agotado, los platos que lo usan dejan de ofrecerse sin
desactivarlos; al reponerlo, vuelven si siguen manualmente activos (regla combinada).

**Prueba independiente**: crear un ingrediente, asociarlo a un plato y ponerlo a agotado, y
comprobar que el plato desaparece de la carta de sala sin que el administrador lo desactive.

### Pruebas de la US3 ⚠️

- [X] T035 [P] [US3] Prueba de integración de agotamiento de ingrediente en `backend/tests/integration/ingrediente-agotado.test.js`
- [X] T036 [P] [US3] Prueba unitaria de la regla combinada (`activo` AND ingredientes disponibles) en `backend/tests/unit/disponibilidad-combinada.test.js`
- [X] T037 [P] [US3] Prueba de componente del panel de ingredientes y el estado combinado en `frontend/tests/components/PanelIngredientes.test.jsx`
- [X] T038 [P] [US3] Prueba de contrato de alta y edición de ingredientes y rechazo de estado inválido en `backend/tests/contract/ingredientes-admin.test.js`
- [X] T039 [P] [US3] Prueba de integración de asociación `ingredienteIds`, ingrediente compartido que oculta todos sus platos y restauración según disponibilidad manual en `backend/tests/integration/ingrediente-compartido.test.js`
- [X] T040 [P] [US3] Prueba de componente de alta, edición y estado de ingrediente en `frontend/tests/components/FormularioIngrediente.test.jsx`
- [X] T041 [P] [US3] Prueba de componente del selector de asociación de ingredientes en `frontend/tests/components/SelectorIngredientes.test.jsx`

### Implementación de la US3

- [X] T042 [US3] Ampliar los esquemas zod con nombre/estado de ingrediente e `ingredienteIds` (existencia y sin duplicados) en `backend/src/api/cartaSchemas.js`
- [X] T043 [US3] Implementar el alta y la edición de ingredientes (`crearIngrediente`, `actualizarIngrediente`) en `backend/src/services/cartaService.js`
- [X] T044 [US3] Implementar la asociación N:M mediante `ingredienteIds` (sustitución del conjunto completo) en `backend/src/services/cartaService.js`
- [X] T045 [US3] Implementar los endpoints `GET/PATCH /api/admin/ingredientes` en `backend/src/api/cartaAdminRouter.js`
- [X] T046 [US3] Implementar el endpoint `POST /api/admin/ingredientes` y completar `PATCH` con nombre y estado en `backend/src/api/cartaAdminRouter.js`
- [X] T047 [US3] Extender la disponibilidad derivada para asociaciones e ingrediente compartido en `backend/src/services/cartaService.js`
- [X] T048 [US3] Implementar el cálculo de `motivo` por ingredientes agotados en `backend/src/services/cartaService.js`
- [X] T049 [US3] Crear el componente `PanelIngredientes` (estado disponible/agotado) en `frontend/src/components/PanelIngredientes.jsx`
- [X] T050 [US3] Crear el componente `FormularioIngrediente` (alta/edición de nombre y estado) en `frontend/src/components/FormularioIngrediente.jsx`
- [X] T051 [US3] Ampliar `PanelIngredientes` con las acciones de alta y edición y conectarlas en `PaginaGestionCarta` en `frontend/src/components/PanelIngredientes.jsx` y `frontend/src/pages/PaginaGestionCarta.jsx`
- [X] T052 [US3] Crear el componente `SelectorIngredientes` (selección múltiple de ingredientes) en `frontend/src/components/SelectorIngredientes.jsx`
- [X] T053 [US3] Integrar `SelectorIngredientes` en el formulario de plato para enviar `ingredienteIds` en `frontend/src/components/FormularioPlato.jsx`
- [X] T054 [US3] Mostrar el motivo de no disponibilidad e integrar el panel en `frontend/src/pages/PaginaGestionCarta.jsx`

**Punto de control**: las tres historias funcionan de forma independiente.

---

## Fase 6: Pulido y aspectos transversales

**Propósito**: mejoras que afectan a varias historias.

- [ ] T055 [P] Crear el componente `EstadoConexion` (sin conexión, conserva lo escrito) en `frontend/src/components/EstadoConexion.jsx`
- [ ] T056 [P] Añadir pruebas de estados de la página (cargando, vacío, error) en `frontend/tests/components/PaginaGestionCarta.test.jsx`
- [ ] T057 [P] Añadir índices SQLite (`plato.partida`, `plato_ingrediente.ingredienteId`) en `backend/db/schema.sql`
- [ ] T058 [P] Actualizar documentación de puesta en marcha en `docs/`
- [ ] T059 Revisar accesibilidad (etiquetas, teclado) de `frontend/src/components/`
- [ ] T060 Ejecutar los escenarios E1–E11 de `quickstart.md` y validar el contrato `contracts/carta-api.md`
- [ ] T061 Ejecutar el escenario E12 de `specs/008-gestion-carta/quickstart.md` (alta de ingrediente, asociación y agotamiento) y validar SC-006
- [ ] T062 Verificar rendimiento (<3 s) y reflejo inmediato en sala (SC-002) según `specs/008-gestion-carta/quickstart.md` (E11)
- [ ] T063 [P] Añadir prueba de inmutabilidad del precio histórico (un cambio de precio no altera líneas ya pedidas ni cuentas pasadas, FR-014) en `backend/tests/integration/precio-historico.test.js`

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Setup (Fase 1)**: sin dependencias.
- **Fundacional (Fase 2)**: depende del Setup; BLOQUEA todas las historias.
- **Historias (Fase 3+)**: dependen del Fundacional; pueden ir en paralelo o en orden de prioridad.
- **Pulido (Fase 6)**: depende de las historias deseadas.

### Dependencias entre historias

- **US1 (P1)**: tras el Fundacional; sin dependencias.
- **US2 (P1)**: tras el Fundacional; integra con US1 (misma página/tabla) pero es verificable sola.
- **US3 (P2)**: tras el Fundacional; integra con US1/US2 (misma página/panel) pero es verificable sola.

### Dentro de cada historia

- Pruebas primero (deben fallar antes de implementar) → modelos → servicios → endpoints → UI.
- Las tareas sobre un mismo fichero son secuenciales (p. ej. las de alta y edición en
  `cartaService.js`).

---

## Ejemplo de paralelismo: US1

```bash
# Lanzar juntas las pruebas de la US1 (ficheros distintos):
Task: "Prueba de contrato en backend/tests/contract/carta-admin.test.js"
Task: "Prueba unitaria en backend/tests/unit/validacion-plato.test.js"
Task: "Prueba de componente en frontend/tests/components/FormularioPlato.test.jsx"
```

---

## Estrategia de implementación

### MVP primero (solo US1)

1. Fase 1 (Setup) y Fase 2 (Fundacional).
2. Fase 3 (US1) → **PARAR y VALIDAR** la US1 de forma independiente.
3. Es el incremento mínimo: crear y modificar platos con validación.

### Entrega incremental

1. Setup + Fundacional.
2. US1 → probar → demo (MVP).
3. US2 → probar → demo (disponibilidad manual).
4. US3 → probar → demo (ingredientes, asociación y baja automática).
5. Pulido.

### Estrategia en equipo

1. El equipo completa Setup + Fundacional.
2. Después, reparto por historia (US1, US2, US3) entre las 4 personas, integrando en
   `cartaService.js`, `cartaAdminRouter.js` y `PaginaGestionCarta.jsx`.

---

## Notas

- [P] = ficheros distintos y sin dependencias pendientes.
- La constitución obliga a parar y esperar revisión/commit tras **cada** tarea durante
  `/speckit.implement`.
- Commits con Conventional Commits en español (constitución, VI).
- No hay `DELETE` de platos: la baja es `activo = false` (supuesto de la spec: preservar el historial de ventas).
- No hay `DELETE` de ingredientes: esta historia cubre alta y edición (FR-015).
- Evitar: tareas vagas, conflictos en el mismo fichero y dependencias cruzadas entre historias.
