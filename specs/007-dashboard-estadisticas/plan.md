# Plan de Implementación: Dashboard de estadísticas del servicio

**Rama**: `feature/007-dashboard-estadisticas` | **Fecha**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `specs/007-dashboard-estadisticas/spec.md`, incluidas las clarificaciones del 2026-10-27.

## Resumen

El encargado necesita, una vez terminado el día, una vista de conjunto de las ventas: total del
día, desglose por camarero y por plato, y comparación contra el día natural anterior (importe y
porcentaje, indicando subida, bajada o sin variación), siempre con formato español y en euros.
Mientras el día en curso no haya terminado, el dashboard muestra el **último día natural completado
anterior a hoy**, aunque ya existan cuentas cerradas hoy.
Cuando el día anterior no registró ventas y el día actual sí, la comparación muestra la diferencia
en euros con la indicación «sin base de comparación» y sin porcentaje (FR-011, SC-006).
La funcionalidad es de solo lectura: agrega las cuentas cerradas del día a partir de los datos que
generan las historias de pedidos (01) y cierre de cuenta (06), sin modificarlos.

El enfoque técnico es una **agregación bajo demanda** sobre los datos de cuentas cerradas,
expuesta por un único endpoint HTTP de solo lectura protegido por sesión y rol de encargado, y
consumida por una página de dashboard en React (Chakra UI) con tablas y badges de tendencia. Se descarta
precalcular o cachear agregados en v1 por simplicidad (volumen bajo de un restaurante medio y
consistencia garantizada con las cuentas cerradas, SC-004).

**Comparación con base cero**: `reportingService` calcula siempre la diferencia absoluta
(`importeActual − importeAnterior`) y solo deriva el porcentaje cuando `importeAnterior > 0`. Si el
día anterior existe pero su importe es 0 y el actual es mayor que 0, devuelve
`diferenciaImporte = importeActual`, `diferenciaPorcentaje = null` y
`sinBaseComparacion = true`; nunca divide entre cero. La UI presenta ese caso con la diferencia en
euros y la etiqueta «sin base de comparación», sin porcentaje (FR-011, SC-006).

## Decisión sobre la fecha por defecto y errores de carga

- La consulta sin `date` debe resolver el **último día natural completado anterior a hoy**. No debe
  devolver el día en curso aunque existan cuentas cerradas hoy.
- `obtenerUltimoDiaCompletado`/`obtenerFechaConsulta` deben excluir explícitamente las fechas
  `>= fechaEnMadrid()`; el endpoint mantiene el `400` para un `date` explícito de hoy o futuro.
- La página debe distinguir:
  - `401/403`: acceso restringido;
  - error de red real: «sin conexión»;
  - `400/500`: mensaje de error del servidor, nunca «sin conexión».
- La regresión de cerrar una cuenta hoy y abrir `/dashboard` debe cubrirse con prueba de API y de
  página.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 22 LTS (backend) y React 18 con JavaScript y
Vite (frontend).

**Dependencias principales**:
- Backend: Express 4 (API HTTP), better-sqlite3 (acceso a datos), zod (validación de parámetros).
- Frontend: React 18, Chakra UI (única librería de componentes, según constitución), React Router.
- Sin librería de gráficas: los desgloses se muestran en tablas y las tendencias con badges/iconos
  y color (Chakra UI), evitando dependencias extra.

**Almacenamiento**: SQLite (archivo persistente, reproducible en Docker). El dashboard solo lee;
no introduce escrituras ni un almacén de agregados propios en v1.

**Pruebas**: Vitest como runner único; Supertest para la API (integración HTTP); React Testing
Library + jsdom para la página del dashboard (componente y estados).

**Plataforma objetivo**: Aplicación web (navegador). Backend en Node.js/Linux sobre Docker;
frontend servido como estáticos. Uso en tablets de sala y puesto de encargado. Requiere conexión
(la spec descarta el modo sin conexión).

**Tipo de proyecto**: Aplicación web (frontend + backend).

**Objetivos de rendimiento**: la consulta del dashboard se resuelve en menos de 3 s (SC-005); la
agregación diaria (SUM/GROUP BY sobre un día de cuentas) por debajo de 1 s en el volumen esperado.

**Restricciones**: moneda euro y convenciones españolas de número/fecha; solo el rol *encargado*
puede acceder mediante sesión real (historia 000); los precios usados son los fijados en el
momento de pedir; el día natural es la unidad de servicio (Europe/Madrid).

**Alcance/Escala**: restaurante medio; consulta de un día concreto; histórico mínimo limitado al
día anterior; pocos usuarios encargados y varias cuentas por día.

## Verificación de la Constitución

*PUERTA: debe pasar antes de la investigación (Fase 0). Se reevalúa tras el diseño (Fase 1).*

| Principio / regla | Comprobación | Estado |
|-------------------|--------------|--------|
| I. Simplicidad | Agregación bajo demanda con SQL; sin capa de caché ni agregados precalculados; sin librería de gráficas | Pasa |
| II. Español de España y euro | Formato `Intl` es-ES y €; día natural Europe/Madrid | Pasa |
| III. Cero alcance fantasma | Solo los FR-001…FR-011 de la spec: lectura + visualización del dashboard, incluida la comparación sin base cuando el día anterior no tuvo ventas; no se implementan pedidos, cierre ni gestión de carta | Pasa |
| IV. Verificable por no técnica | `quickstart.md` con escenarios de comprobación desde la interfaz | Pasa |
| V. Datos con respeto | Solo se leen ventas, camarero y plato; sin datos personales innecesarios ni secretos | Pasa |
| VI. Conventional Commits | Aplicable en la fase de implementación | Pasa |
| VII. Desarrollo en equipo | Estructura de carpetas y comandos documentados | Pasa |
| Tecnología obligatoria | React + Chakra UI; ExpressJS sobre Node.js | Pasa |
| Contenedores (Docker) | `Dockerfile` + `docker-compose` para frontend y backend | Pasa |
| Calidad y pruebas | Pruebas automatizadas de agregación, API y componente | Pasa |
| Flujo de trabajo (Git Flow) | Rama `feature/*` desde `develop`, PR revisado | Pasa |

Sin violaciones: no se requiere justificación en "Seguimiento de Complejidad".

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/007-dashboard-estadisticas/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Salida Fase 0 (/speckit.plan)
├── data-model.md        # Salida Fase 1 (/speckit.plan)
├── quickstart.md        # Salida Fase 1 (/speckit.plan)
├── contracts/           # Salida Fase 1 (/speckit.plan)
│   ├── reports-api.md
│   └── dashboard-ui.md
└── tasks.md             # Salida Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── models/          # tipos y acceso a datos (Cuenta cerrada, Consumo, Camarero, Plato)
│   ├── services/        # reportingService: agregación diaria y comparación
│   ├── api/             # rutas/controladores HTTP (reportsRouter)
│   └── middleware/      # autorización por rol (encargado)
├── db/                  # esquema y datos semilla (SQLite)
└── tests/
    ├── contract/        # contrato del endpoint de informes (Supertest)
    ├── integration/     # agregación sobre datos sembrados
    └── unit/            # cálculo de totales, diferencias y tendencia

frontend/
├── src/
│   ├── pages/           # PaginaDashboard (ruta /dashboard)
│   ├── components/      # TablaDesglose, IndicadorTendencia, EstadoConexion
│   └── services/        # cliente HTTP de informes (fetch) y sesión (000)
└── tests/
    └── components/      # estados de la página (cargando, error/sin conexión, datos, vacío)
```

**Decisión de estructura**: aplicación web con `frontend/` y `backend/` separados, coherente con
el stack obligatorio (React/Chakra UI y ExpressJS) y con Docker para levantar ambos. La
funcionalidad añade la capa de informes (servicio de agregación + endpoint + página), reutilizando
los datos de cuentas cerradas de otras historias sin reimplementarlos.

## Seguimiento de Complejidad

> Sin violaciones de la constitución. No se rellena.
