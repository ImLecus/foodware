# Plan de Implementación: Gestión de la carta

**Rama**: `feature/008-gestion-carta` | **Fecha**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `specs/008-gestion-carta/spec.md`

## Resumen

El administrador necesita gestionar la carta sin soporte técnico: crear y editar platos, modificar
nombre, partida y precio, controlar su disponibilidad y gestionar los ingredientes (crearlos,
editarlos, asociarlos a uno o varios platos y cambiar su estado), de modo que la carta que ven las
tabletas de sala esté siempre actualizada y no se tomen pedidos que cocina no pueda preparar. La
disponibilidad es **combinada**: un plato se ofrece solo si está manualmente activo y todos sus
ingredientes están disponibles; el agotamiento de un ingrediente registrado en el sistema retira sus
platos de la oferta de forma automática. Las partidas son fijas (entrantes, principales y postres).

El enfoque técnico es un **CRUD de platos** y de **ingredientes** con su **asociación N:M**, expuesto
por endpoints HTTP protegidos por rol de administrador, y un endpoint de **carta vigente** de solo
lectura que consumen las tabletas de sala (historia 01). En concreto, `/api/admin/platos` cubre el
alta, la edición y la asociación de ingredientes mediante `ingredienteIds`; `/api/admin/ingredientes`
cubre el alta, la edición de nombre y el cambio de estado. La asociación se guarda en
`PlatoIngrediente` y solo admite ingredientes existentes. La disponibilidad ofrecida se **deriva en
la lectura** (activo AND ingredientes disponibles), sin persistir un estado calculado ni caché: así
cualquier cambio, incluido el estado de un ingrediente, se refleja de inmediato (SC-002, FR-015) y la
verdad es única. Los platos con historial de ventas no se borran; se desactivan para preservar el
historial (supuesto de la spec: conservar el historial de ventas).

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 22 LTS (backend) y React 18 con JavaScript y
Vite (frontend).

**Dependencias principales**:
- Backend: Express 4 (API HTTP), better-sqlite3 (acceso a datos), zod (validación de cuerpos y
  parámetros).
- Frontend: React 18, Chakra UI (única librería de componentes, según constitución), React Router.
- Sin librerías de formularios ni de estado adicionales: formularios controlados de React y
  `fetch` nativo, por simplicidad.

**Almacenamiento**: SQLite (archivo persistente, reproducible en Docker). La funcionalidad escribe
platos e ingredientes; la carta ofrecida se calcula en la consulta.

**Pruebas**: Vitest como runner único; Supertest para la API (contrato e integración HTTP de
gestión y de carta vigente); React Testing Library + jsdom para la página de gestión y sus estados.

**Plataforma objetivo**: Aplicación web (navegador). Backend en Node.js/Linux sobre Docker;
frontend servido como estáticos. Uso en puesto de administrador y en tabletas de sala (consulta).
Requiere conexión (la spec descarta el modo sin conexión).

**Tipo de proyecto**: Aplicación web (frontend + backend).

**Objetivos de rendimiento**: un cambio de precio o de disponibilidad se refleja en la carta de
sala en menos de 3 s sin acciones adicionales (SC-002); la consulta de la carta vigente y el guardado
de un plato responden por debajo de 1 s en el volumen esperado.

**Restricciones**: moneda euro y convenciones españolas de número y fecha; solo el rol
*administrador* gestiona la carta; los demás usuarios solo consultan la carta vigente; partidas
fijas (entrantes, principales, postres); los precios de platos ya pedidos no se alteran (precio
fijado al pedir, historia 01).

**Alcance/Escala**: restaurante medio; decenas de platos y un conjunto pequeño de ingredientes;
pocos administradores y muchas consultas de sala.

## Verificación de la Constitución

*PUERTA: debe pasar antes de la investigación (Fase 0). Se reevalúa tras el diseño (Fase 1).*

| Principio / regla | Comprobación | Estado |
|-------------------|--------------|--------|
| I. Simplicidad | CRUD directo de platos e ingredientes y asociación N:M simple; disponibilidad derivada en lectura; sin caché, sin estado calculado persistido ni librerías de formularios | Pasa |
| II. Español de España y euro | Formato `Intl` es-ES y €; textos y partidas en español | Pasa |
| III. Cero alcance fantasma | Solo gestión de carta (platos, precios, disponibilidad, ingredientes y asociaciones; FR-001–FR-015); no se implementan pedidos, cierre ni dashboard | Pasa |
| IV. Verificable por no técnica | `quickstart.md` con escenarios de comprobación desde la interfaz | Pasa |
| V. Datos con respeto | Solo se gestionan datos de platos e ingredientes; sin datos personales innecesarios ni secretos | Pasa |
| VI. Conventional Commits | Aplicable en la fase de implementación | Pasa |
| VII. Desarrollo en equipo | Estructura de carpetas y comandos documentados | Pasa |
| Tecnología obligatoria | React + Chakra UI; ExpressJS sobre Node.js | Pasa |
| Contenedores (Docker) | `Dockerfile` + `docker-compose` para frontend y backend | Pasa |
| Calidad y pruebas | Pruebas automatizadas de servicio, API y componente | Pasa |
| Flujo de trabajo (Git Flow) | Rama `feature/*` desde `develop`, PR revisado | Pasa |

Sin violaciones: no se requiere justificación en "Seguimiento de Complejidad".

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/008-gestion-carta/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Salida Fase 0 (/speckit.plan)
├── data-model.md        # Salida Fase 1 (/speckit.plan)
├── quickstart.md        # Salida Fase 1 (/speckit.plan)
├── contracts/           # Salida Fase 1 (/speckit.plan)
│   ├── carta-api.md
│   └── carta-ui.md
└── tasks.md             # Salida Fase 2 (/speckit.tasks - NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── models/          # tipos y acceso a datos (Plato, Ingrediente, PlatoIngrediente)
│   ├── services/        # cartaService: alta/edición de platos e ingredientes, asociación, disponibilidad derivada, carta vigente
│   ├── api/             # rutas/controladores HTTP (cartaAdminRouter, cartaRouter)
│   └── middleware/      # autorización por rol (administrador)
├── db/                  # esquema y datos semilla (SQLite)
└── tests/
    ├── contract/        # contrato de los endpoints de gestión y de carta (Supertest)
    ├── integration/     # reglas de disponibilidad sobre datos sembrados
    └── unit/            # validación de precio, partidas y cálculo de disponibilidad

frontend/
├── src/
│   ├── pages/           # PaginaGestionCarta (ruta /admin/carta)
│   ├── components/      # TablaPlatos, FormularioPlato, PanelIngredientes, FormularioIngrediente, SelectorIngredientes, EstadoConexion
│   └── services/        # cliente HTTP de carta (fetch)
└── tests/
    └── components/      # estados de la página (cargando, error/sin conexión, datos, vacío)
```

**Decisión de estructura**: aplicación web con `frontend/` y `backend/` separados, coherente con
el stack obligatorio (React/Chakra UI y ExpressJS) y con Docker para levantar ambos. La
funcionalidad añade la capa de gestión de carta (platos, ingredientes y asociaciones: servicio +
endpoints + página) y un endpoint de carta vigente que reutiliza la tabla de platos de la historia
01, sin reimplementar la toma de pedidos.

## Seguimiento de Complejidad

> Sin violaciones de la constitución. No se rellena.
