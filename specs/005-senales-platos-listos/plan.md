# Implementation Plan: Señales de platos listos por mesa

**Branch**: `005-senales-platos-listos` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-senales-platos-listos/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

El camarero necesita ver, sin recargar, el estado (pendiente/listo) de los platos de
todas las mesas abiertas y recibir un aviso perceptible cuando una mesa queda completa,
pudiendo descartarlo. El estado de cada plato lo produce la historia 04 (cocina) y esta
historia solo lo consume y lo muestra; el único dato que esta historia crea es el aviso
de mesa (activo/descartado).

Enfoque técnico: una vista web de sala (React + Chakra UI) que obtiene el estado por la
API HTTP de Express y lo mantiene al día mediante **Server-Sent Events (SSE)** nativos
del navegador. No hay inicio de sesión ni asignación de mesas por camarero: todas las
mesas son compartidas (FR-011). La aplicación exige conexión; al perderse muestra un
indicador de "sin conexión", marca los datos como no actualizados y se resincroniza al
recuperarla (FR-014).

## Technical Context

**Language/Version**: JavaScript (ES2022) sobre Node.js 20 LTS; frontend React 18 (JSX).

**Primary Dependencies**: React 18 + Chakra UI (única librería de componentes de UI),
ExpressJS 4 (API HTTP), `EventSource` nativo del navegador para tiempo real, PostgreSQL 16
con el cliente `pg`.

**Storage**: PostgreSQL 16 en contenedor, consultado con SQL sencillo mediante `pg`;
migraciones versionadas en el repositorio. Entidades de plato/pedido/mesa pertenecen a las
historias 01–04; esta historia añade la tabla de avisos de mesa.

**Testing**: Backend Jest + Supertest; Frontend Vitest + React Testing Library.

**Target Platform**: Aplicación web (navegador en tablet/PC de sala) más servidor Node;
ejecución reproducible con Docker (Linux).

**Project Type**: Aplicación web con frontend y backend separados.

**Performance Goals**: un cambio de estado se ve en ≤ 5 s (SC-002/FR-004); resincronización
tras reconexión en ≤ 10 s (SC-008); identificar los platos listos en ≤ 2 s (SC-001);
descartar el aviso en ≤ 2 s (SC-005).

**Constraints**: requiere conexión a la red del restaurante (FR-014); UI solo con Chakra UI;
sin frameworks adicionales sin enmienda; todos los textos en español de España; arranque
reproducible con Docker.

**Scale/Scope**: un único restaurante; decenas de mesas abiertas y un puñado de pantallas
concurrentes (sala y cocina). Alcance de esta historia: una vista de sala con estado en vivo
y avisos por mesa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Evaluación | Estado |
|-------------------|------------|--------|
| I. Simplicidad ante todo | Vista + API + SSE; sin capas, ni gestor de estado global, ni ORM | PASA |
| II. Español de España y euro | Todos los textos de la vista en español; sin importes en esta historia | PASA |
| III. Cero alcance fantasma | Solo se implementa lo especificado (estado de platos, aviso, descarte, sin conexión) | PASA |
| IV. Verificable por no técnico | Comprobable desde la interfaz (marcar en cocina → ver en sala; aviso; descarte) | PASA |
| V. Datos con respeto | Sin datos personales más allá de la identidad ya existente; secretos por variables de entorno, nunca en el repo | PASA |
| VI. Conventional Commits | Proceso de commits del equipo; no afecta al diseño | PASA |
| VII. Desarrollo en equipo | Docker, README de arranque y decisiones documentadas en el repo | PASA |
| Tecnología obligatoria | React + Chakra UI (frontend), ExpressJS sobre Node (backend); no se añaden frameworks | PASA |
| Contenedores (Docker) | `docker-compose` levanta frontend, backend y base de datos | PASA |
| Calidad y pruebas | Cada tarea incluye pruebas automatizadas junto al desarrollo | PASA |
| Flujo de trabajo (Git Flow) | Feature parte de `develop` y vuelve por Pull Request | PASA |

**Resultado (pre-diseño)**: sin violaciones. No se requiere Complexity Tracking.

**Resultado (post-diseño, tras Fase 1)**: se mantiene sin violaciones; SSE y `pg` son
librerías/nativos, no frameworks, por lo que no rompen la Tecnología obligatoria.

## Project Structure

### Documentation (this feature)

```text
specs/005-senales-platos-listos/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.js                 # Express app (middleware + rutas)
│   ├── server.js              # Servidor HTTP + hub de eventos SSE
│   ├── db.js                  # Pool de PostgreSQL (pg) + runner de migraciones
│   ├── migrations/            # Migraciones SQL versionadas
│   ├── routes/
│   │   ├── sala.js            # GET /api/sala/mesas
│   │   └── avisos.js          # POST /api/sala/avisos/:id/descartar
│   ├── realtime/
│   │   └── eventos.js         # Alta/baja de clientes SSE y difusión de eventos
│   └── services/
│       ├── mesasService.js    # Lectura de mesas abiertas y estado de platos
│       └── avisosService.js   # Cálculo de completitud y ciclo de vida del aviso
└── tests/
    ├── contract/              # Contratos de API (Supertest)
    ├── integration/           # Vista de sala + avisos
    └── unit/                  # Completitud de mesa, reversibilidad, descarte

frontend/
├── src/
│   ├── pages/
│   │   └── SalaCamarero.jsx   # Vista principal de mesas abiertas
│   ├── components/
│   │   ├── MesaCard.jsx       # Mesa con su relación de platos
│   │   ├── PlatoEstado.jsx    # Indicador pendiente/listo
│   │   ├── AvisoMesa.jsx      # Señal visual destacada por mesa
│   │   └── SinConexion.jsx    # Indicador de "sin conexión"
│   ├── hooks/
│   │   └── useSala.js         # Estado de mesas + suscripción SSE + reconexión
│   └── services/
│       ├── api.js             # Llamadas HTTP (fetch)
│       └── live.js            # Envoltorio de EventSource
└── tests/
    ├── components/            # Distinción visual, estado vacío/carga, aviso
    └── integration/           # Flujo en vivo y sin conexión

docker-compose.yml             # frontend + backend + PostgreSQL
backend/Dockerfile
frontend/Dockerfile
```

**Structure Decision**: se elige la opción "Web application" (frontend + backend
separados), coherente con la Tecnología obligatoria de la constitución. El backend
ExpressJS expone la API HTTP y la conexión SSE de sala; el frontend React + Chakra UI
renderiza la vista del camarero y consume ambas. La base de datos PostgreSQL se
aprovisiona con `docker-compose`. Esta feature añade a la API existente las rutas de sala
y el flujo de eventos; las entidades Mesa/Plato/Pedido son propiedad de las historias
01–04 y aquí solo se leen.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No hay violaciones: la solución usa únicamente el stack obligatorio y no introduce
complejidad anticipada.
