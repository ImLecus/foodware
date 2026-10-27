# Tareas: Dashboard de estadísticas del servicio

**Entrada**: Documentos de diseño en `/specs/007-dashboard-estadisticas/`

**Prerrequisitos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Pruebas**: Obligatorias en este proyecto (constitución: "sin pruebas, la funcionalidad no está
completa"). Cada tarea de prueba se escribe antes que su implementación.

**Organización**: Tareas agrupadas por historia de usuario para permitir implementación y prueba
independientes.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: Puede ejecutarse en paralelo (ficheros distintos, sin dependencias pendientes)
- **[Story]**: Historia de usuario a la que pertenece (US1, US2, US3)
- Las descripciones incluyen rutas de fichero exactas

## Convenciones de rutas

- Aplicación web: `backend/src/` y `frontend/src/`
- Pruebas: `backend/tests/` y `frontend/tests/`

---

## Fase 1: Setup (infraestructura compartida)

**Propósito**: Inicialización del proyecto y estructura básica

- [X] T001 Crear la estructura de backend y frontend según plan.md (`backend/`, `frontend/`, `backend/Dockerfile`, `frontend/Dockerfile`)
- [X] T002 Inicializar el backend con Express + JavaScript en `backend/package.json`
- [X] T003 [P] Inicializar el frontend con React + Vite + Chakra UI + JavaScript en `frontend/package.json`
- [X] T004 [P] Configurar Vitest, ESLint y Prettier en `backend/vitest.config.js` y `frontend/vitest.config.js`
- [X] T005 Configurar los servicios `backend` y `frontend` en `docker-compose.yml`

---

## Fase 2: Fundacional (prerrequisitos bloqueantes)

**Propósito**: Infraestructura que MUST completarse antes de cualquier historia de usuario

**⚠️ CRÍTICO**: Ninguna historia puede empezar hasta terminar esta fase

- [X] T006 Crear el esquema SQLite de `cuentas`, `platos`, `usuarios` y `pedidos`/`lineas_pedido` en `backend/migrations/001_init.sql` (esquema canónico compartido; ya en el esqueleto)
- [X] T007 [P] Configurar el cliente de SQLite en `backend/src/db/index.js` (ya en el esqueleto)
- [X] T008 [P] Tipos de entidad compartidos: no aplica (JavaScript sin TypeScript); las entidades quedan documentadas en `data-model.md`
- [X] T009 Implementar el middleware de autorización por rol `encargado` en `backend/src/middleware/authorize.js` (identidad por cabecera `x-usuario-id`)
- [X] T010 Configurar el enrutador de la API y el middleware de errores en `backend/src/app.js` y `backend/src/middleware/error.js` (ya en el esqueleto)
- [X] T011 Implementar utilidades de límites del día natural Europe/Madrid en `backend/src/services/dayTime.js`
- [X] T012 [P] Crear el script de datos semilla con cuentas cerradas en dos días distintos en `backend/src/db/seed.js`
- [X] T013 [P] Configurar el enrutado del frontend y el acceso por rol en `frontend/src/App.jsx` (guarda `frontend/src/components/RutaEncargado.jsx`, identidad/rol en `frontend/src/services/sesion.js`)
- [X] T014 [P] Implementar el cliente HTTP de informes (fetch) en `frontend/src/services/reports.js`

**Checkpoint**: Base lista — las historias de usuario pueden comenzar

---

## Fase 3: US1 - Visión global de las ventas del servicio (P1) 🎯 MVP

**Objetivo**: Mostrar al encargado el total vendido del día natural consultado.

**Prueba independiente**: Con cuentas cerradas sembradas, `GET /api/reports/daily` devuelve el
total del día y la página `/dashboard` lo muestra en euros; un día sin ventas muestra `0,00 €`.

### Pruebas de US1

- [X] T015 [P] [US1] Prueba de contrato del total en `GET /api/reports/daily` en `backend/tests/contract/reports_daily.test.js`
- [X] T016 [P] [US1] Prueba unitaria del cálculo del total diario en `backend/tests/unit/reporting_total.test.js`
- [X] T017 [P] [US1] Prueba de componente del total y estados de la página en `frontend/tests/components/dashboard_total.test.jsx`

### Implementación de US1

- [X] T018 [US1] Implementar la agregación del total diario por fecha (por defecto, el último día natural completado) en `backend/src/services/reportingService.js` (depende de T007, T008, T011)
- [X] T019 [US1] Implementar el endpoint `GET /api/reports/daily` devolviendo el total en `backend/src/api/reportsRouter.js` (depende de T018)
- [X] T020 [US1] Añadir validación del parámetro `date` (formato, fecha válida, rechazo del día en curso y de fechas futuras con `400`) en `backend/src/api/reportsRouter.js`
- [X] T021 [US1] Aplicar la autorización de rol `encargado` al endpoint en `backend/src/api/reportsRouter.js` (depende de T009)
- [X] T022 [US1] Implementar utilidades de formato es-ES de importes y fechas en `frontend/src/utils/format.js`
- [X] T023 [US1] Construir la página del dashboard con total y estados cargando/vacío/sin conexión en `frontend/src/pages/PaginaDashboard.jsx`
- [X] T024 [US1] Conectar la página con el cliente de informes en `frontend/src/pages/PaginaDashboard.jsx` (depende de T014, T023)

**Checkpoint**: US1 funcional y verificable de forma independiente (MVP del dashboard)

---

## Fase 4: US2 - Desglose de las ventas por camarero y por plato (P1)

**Objetivo**: Añadir al dashboard las tablas de ventas por camarero y por plato del día.

**Prueba independiente**: Tras cerrar cuentas de varios camareros, el informe devuelve el importe
por camarero y la cantidad/importe por plato, mostrando `0,00 €` en los que no vendieron.

### Pruebas de US2

- [ ] T025 [P] [US2] Prueba de contrato de los campos `porCamarero`/`porPlato` en `backend/tests/contract/reports_breakdowns.test.js`
- [ ] T026 [P] [US2] Prueba unitaria de agrupación por camarero y por plato en `backend/tests/unit/reporting_breakdowns.test.js`
- [ ] T027 [P] [US2] Prueba de componente de las tablas de desglose en `frontend/tests/components/dashboard_breakdowns.test.jsx`

### Implementación de US2

- [ ] T028 [US2] Ampliar el servicio con la agrupación por camarero en `backend/src/services/reportingService.js`
- [ ] T029 [US2] Ampliar el servicio con la agrupación por plato, incluyendo actores con 0,00 € en `backend/src/services/reportingService.js`
- [ ] T030 [US2] Incluir `porCamarero` y `porPlato` en la respuesta del endpoint en `backend/src/api/reportsRouter.js`
- [ ] T031 [P] [US2] Crear el componente de tabla de desglose reutilizable en `frontend/src/components/TablaDesglose.jsx`
- [ ] T032 [US2] Renderizar las tablas de desglose en la página del dashboard en `frontend/src/pages/PaginaDashboard.jsx` (depende de T031)

**Checkpoint**: US1 y US2 funcionan de forma independiente

---

## Fase 5: US3 - Comparación con días anteriores (P2)

**Objetivo**: Comparar el día actual con el día natural anterior (importe, porcentaje y tendencia)
en el total y en los desgloses, incluido el caso de día anterior sin ventas (diferencia en euros
con «sin base de comparación», sin porcentaje).

**Prueba independiente**: El informe muestra la diferencia frente al día anterior con tendencia
subida/bajada/sin variación; si no hay día anterior, muestra "sin datos anteriores"; si el día
anterior no tuvo ventas, muestra la diferencia en euros con «sin base de comparación» y sin
porcentaje.

### Pruebas de US3

- [ ] T033 [P] [US3] Prueba de contrato del bloque `comparacion` en `backend/tests/contract/reports_comparison.test.js`
- [ ] T034 [P] [US3] Prueba unitaria de diferencia y tendencia y del caso sin día anterior en `backend/tests/unit/reporting_comparison.test.js`
- [ ] T035 [P] [US3] Prueba de componente del indicador de tendencia en `frontend/tests/components/dashboard_comparison.test.jsx`
- [ ] T036 [P] [US3] Prueba de integración del cálculo con base cero (sin división por cero, sin porcentaje, tendencia `subida`) en `backend/tests/integration/reporting_zero_base.test.js`
- [ ] T037 [P] [US3] Prueba de componente de la presentación «sin base de comparación» en `frontend/tests/components/dashboard_comparison_zero_base.test.jsx`

### Implementación de US3

- [ ] T038 [US3] Implementar el cálculo de la comparación (importe, porcentaje, tendencia) en `backend/src/services/reportingService.js`
- [ ] T039 [US3] Manejar el caso sin día anterior (`diaAnterior = null`) en `backend/src/services/reportingService.js`
- [ ] T040 [US3] Añadir la comparación por camarero y por plato en `backend/src/services/reportingService.js`
- [ ] T041 [US3] Incluir `comparacion` en la respuesta del endpoint en `backend/src/api/reportsRouter.js`
- [ ] T042 [US3] Implementar la comparación con base cero (`diferenciaImporte` absoluta, `diferenciaPorcentaje = null`, tendencia `subida`) y exponer `sinBaseComparacion` en la respuesta en `backend/src/services/reportingService.js` y `backend/src/api/reportsRouter.js` (depende de T041)
- [ ] T043 [P] [US3] Crear el componente de indicador de tendencia (icono + color + texto) en `frontend/src/components/IndicadorTendencia.jsx`
- [ ] T044 [US3] Renderizar el bloque de comparación en la página del dashboard en `frontend/src/pages/PaginaDashboard.jsx` (depende de T043)
- [ ] T045 [US3] Mostrar «sin base de comparación» con la diferencia absoluta en euros y sin porcentaje cuando `sinBaseComparacion = true` en `frontend/src/pages/PaginaDashboard.jsx` (depende de T044)

**Checkpoint**: las tres historias son funcionales e independientemente verificables

---

## Fase 6: Pulido y aspectos transversales

**Propósito**: Mejoras que afectan a varias historias

- [ ] T046 [P] Añadir índice sobre `cuentas(fechaCierre, estado)` para el rendimiento (<3 s) en `backend/db/schema.sql`
- [ ] T047 [P] Implementar el estado "sin conexión" reutilizable en `frontend/src/components/EstadoConexion.jsx`
- [ ] T048 [P] Actualizar la documentación de puesta en marcha en `README.md`
- [ ] T049 Auditar accesibilidad de tablas e indicadores (texto + icono, no solo color) en `frontend/src/components/TablaDesglose.jsx` y `frontend/src/components/IndicadorTendencia.jsx`
- [ ] T050 Ejecutar los escenarios E1–E9 de `quickstart.md` y registrar resultados
- [ ] T051 Ejecutar el escenario E10 de `quickstart.md` (día anterior sin ventas: diferencia en euros, «sin base de comparación», sin porcentaje) y registrar resultados (depende de T042, T045)
- [ ] T052 [P] Endurecer la seguridad (comprobación de rol en backend, sin datos de más) en `backend/src/api/reportsRouter.js`
- [ ] T053 [P] Añadir prueba de formato es-ES de importes y fechas (punto de miles, coma decimal, € y fecha) en `frontend/tests/utils/format.test.js`

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Setup (Fase 1)**: sin dependencias; puede empezar de inmediato
- **Fundacional (Fase 2)**: depende del Setup; BLOQUEA todas las historias
- **Historias (Fase 3+)**: dependen de la Fase 2; pueden ir en paralelo o en orden de prioridad
- **Pulido (Fase 6)**: depende de las historias deseadas

### Dependencias entre historias

- **US1 (P1)**: empieza tras la Fase 2; sin dependencias de otras historias
- **US2 (P1)**: empieza tras la Fase 2; amplía el mismo servicio/endpoint/página que US1 (integra
  con US1 pero es verificable por separado)
- **US3 (P2)**: empieza tras la Fase 2; amplía el servicio/endpoint/página (integra con US1/US2)

### Dentro de cada historia

- Las pruebas se escriben primero y MUST fallar antes de implementar
- Servicios antes que endpoints; componentes antes de integrarlos en la página

### Oportunidades de paralelismo

- Todas las tareas [P] de Setup y Fase 2 pueden ir en paralelo
- Las tareas de prueba [P] de cada historia pueden ir en paralelo
- Distintas historias pueden repartirse entre las 4 personas del equipo

---

## Ejemplo de paralelismo: US1

```bash
# Lanzar las pruebas de US1 en paralelo:
Task: "Prueba de contrato del total en backend/tests/contract/reports_daily.test.js"
Task: "Prueba unitaria del total diario en backend/tests/unit/reporting_total.test.js"
Task: "Prueba de componente del total en frontend/tests/components/dashboard_total.test.jsx"
```

---

## Estrategia de implementación

### MVP primero (solo US1)

1. Completar Fase 1 (Setup)
2. Completar Fase 2 (Fundacional — bloquea todo)
3. Completar Fase 3 (US1)
4. **PARAR Y VALIDAR**: probar US1 de forma independiente (escenarios E1 y E5 de `quickstart.md`)
5. Demostrar el total del día ya aporta valor

### Entrega incremental

1. Setup + Fundacional → base lista
2. US1 → total del día (MVP)
3. US2 → desgloses por camarero y plato
4. US3 → comparación con el día anterior
5. Cada historia añade valor sin romper las anteriores

### Estrategia de equipo en paralelo

1. El equipo completa Setup + Fundacional
2. Después: persona A → US1, persona B → US2, persona C → US3 (con integración progresiva en
   `reportingService.js`, `reportsRouter.js` y `PaginaDashboard.jsx`)

---

## Notas

- [P] = ficheros distintos, sin dependencias
- [Story] asocia cada tarea a su historia para trazabilidad
- Constitución VI: commits con Conventional Commits; Git Flow (`feature/*` desde `develop`)
- Constitución (parada por tarea): al implementar con `/speckit.implement`, detenerse al terminar
  **cada** tarea, resumir lo hecho y esperar a que el usuario la revise y commitee antes de seguir
- Evitar tareas vagas y conflictos de fichero entre historias
