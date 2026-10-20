# Plan de Implementación: Señales de platos listos por mesa

**Rama**: `feature/005-senales-platos-listos` | **Fecha**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/005-senales-platos-listos/spec.md`

**Nota**: Este fichero lo genera el comando `/speckit.plan`; su definición describe el flujo de ejecución.

## Resumen

El camarero necesita ver, sin recargar, el estado (pendiente/listo) de los platos de
todas las mesas abiertas y recibir un aviso perceptible cuando una mesa queda completa,
pudiendo descartarlo. El descarte es **global** (FR-009, FR-010): cuando un camarero
descarta el aviso, deja de mostrarse para todos los camareros y en todas las pantallas
del restaurante hasta que se marque un nuevo plato como listo en esa mesa (SC-009). El
estado de cada plato lo produce la historia 04 (cocina) y esta historia solo lo consume
y lo muestra; el único dato que esta historia crea es el aviso de mesa
(activo/descartado), compartido por toda la sala.

Enfoque técnico: una vista web de sala (React + Chakra UI) que obtiene el estado por la
API HTTP de Express y lo mantiene al día mediante **Server-Sent Events (SSE)** nativos
del navegador. El backend publica los cambios en un **hub SSE compartido**, de modo que
todos los clientes conectados reciben el mismo evento; al descartar un aviso se emite un
evento de difusión que lo retira de todas las pantallas, garantizando su coherencia entre
dispositivos. No hay inicio de sesión ni asignación de mesas por camarero: todas las
mesas son compartidas (FR-011). La aplicación exige conexión; al perderse muestra un
indicador de "sin conexión", marca los datos como no actualizados y se resincroniza al
recuperarla (FR-014).

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022) sobre Node.js 20 LTS; frontend React 18 (JSX).

**Dependencias principales**: React 18 + Chakra UI (única librería de componentes de UI),
ExpressJS 4 (API HTTP), `EventSource` nativo del navegador para tiempo real, SQLite
con el cliente `better-sqlite3`.

**Almacenamiento**: SQLite en fichero persistido en un volumen Docker, consultado con SQL sencillo mediante `better-sqlite3`;
migraciones versionadas en el repositorio. Entidades de plato/pedido/mesa pertenecen a las
historias 01–04; esta historia añade la tabla de avisos de mesa.

**Pruebas**: Backend Vitest + Supertest; Frontend Vitest + React Testing Library.

**Plataforma objetivo**: Aplicación web (navegador en tablet/PC de sala) más servidor Node;
ejecución reproducible con Docker (Linux).

**Tipo de proyecto**: Aplicación web con frontend y backend separados.

**Objetivos de rendimiento**: un cambio de estado se ve en ≤ 5 s (SC-002/FR-004); resincronización
tras reconexión en ≤ 10 s (SC-008); identificar los platos listos en ≤ 2 s (SC-001);
descartar el aviso en ≤ 2 s (SC-005); el descarte se refleja en todas las pantallas en ≤ 5 s
(SC-009).

**Restricciones**: requiere conexión a la red del restaurante (FR-014); UI solo con Chakra UI;
sin frameworks adicionales sin enmienda; todos los textos en español de España; arranque
reproducible con Docker.

**Escala/Alcance**: un único restaurante; decenas de mesas abiertas y un puñado de pantallas
concurrentes (sala y cocina). Alcance de esta historia: una vista de sala con estado en vivo
y avisos por mesa.

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|------------|--------|
| I. Simplicidad ante todo | Vista + API + SSE; sin capas, ni gestor de estado global, ni ORM | Pasa |
| II. Español de España y euro | Todos los textos de la vista en español; sin importes en esta historia | Pasa |
| III. Cero alcance fantasma | Solo se implementa lo especificado (FR-001…FR-015): estado de platos, aviso, descarte global para todos los camareros y pantallas (FR-009, FR-010) y sin conexión | Pasa |
| IV. Verificable por no técnico | Comprobable desde la interfaz (marcar en cocina → ver en sala; aviso; descarte) | Pasa |
| V. Datos con respeto | Sin datos personales más allá de la identidad ya existente; secretos por variables de entorno, nunca en el repo | Pasa |
| VI. Conventional Commits | Proceso de commits del equipo; no afecta al diseño | Pasa |
| VII. Desarrollo en equipo | Docker, README de arranque y decisiones documentadas en el repo | Pasa |
| Tecnología obligatoria | React + Chakra UI (frontend), ExpressJS sobre Node (backend); no se añaden frameworks | Pasa |
| Contenedores (Docker) | `docker-compose` levanta frontend y backend (SQLite en volumen) | Pasa |
| Calidad y pruebas | Cada tarea incluye pruebas automatizadas junto al desarrollo | Pasa |
| Flujo de trabajo (Git Flow) | Feature parte de `develop` y vuelve por Pull Request | Pasa |

**Resultado (pre-diseño)**: sin violaciones. No se requiere Complexity Tracking.

**Resultado (post-diseño, tras Fase 1)**: se mantiene sin violaciones; SSE y `better-sqlite3` son
librerías/nativos, no frameworks, por lo que no rompen la Tecnología obligatoria.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

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

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── app.js                 # Express app (middleware + rutas)
│   ├── server.js              # Servidor HTTP; publica en el hub SSE compartido (`realtime/hub.js`)
│   ├── db.js                  # Conexión a SQLite (better-sqlite3) + runner de migraciones
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

docker-compose.yml             # frontend + backend (SQLite en volumen)
backend/Dockerfile
frontend/Dockerfile
```

**Decisión de estructura**: se elige la opción "Web application" (frontend + backend
separados), coherente con la Tecnología obligatoria de la constitución. El backend
ExpressJS expone la API HTTP y la conexión SSE de sala; el frontend React + Chakra UI
renderiza la vista del camarero y consume ambas. La base de datos SQLite se
aprovisiona con `docker-compose`. Esta feature añade a la API existente las rutas de sala
y el flujo de eventos; las entidades Mesa/Plato/Pedido son propiedad de las historias
01–04 y aquí solo se leen.

## Seguimiento de Complejidad

> **Rellena SOLO si la Verificación de la Constitución tiene violaciones que justificar**

No hay violaciones: la solución usa únicamente el stack obligatorio y no introduce
complejidad anticipada.
