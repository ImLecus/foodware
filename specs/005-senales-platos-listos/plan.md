# Plan de Implementación: Señales de platos listos por mesa

**Rama**: `feature/005-senales-platos-listos` | **Fecha**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/005-senales-platos-listos/spec.md`

**Nota**: Este fichero lo genera el comando `/speckit.plan`; su definición describe el flujo de ejecución.

## Resumen

El camarero necesita ver, sin recargar, el estado (pendiente/listo) de los platos de
todas las mesas abiertas y recibir un aviso perceptible cuando una mesa queda completa,
pudiendo descartarlo. El descarte es **global** (FR-009, FR-010): cuando un camarero
descarta el aviso, deja de mostrarse para todos los camareros y en todas las pantallas
del restaurante hasta que se marque un nuevo plato como listo en esa mesa (SC-009).

Esta historia **consume** el estado de los platos y, además, incluye el **mecanismo
mínimo de marcado/desmarcado** (FR-016) que hasta ahora no existía: hoy nada del sistema
pone un plato en estado `listo`. El endpoint marca y deshace la marca de una línea ya
enviada a cocina, sin pantalla de cocina ni aviso temporal (alcance de la historia 004).
Los únicos datos que esta historia crea son el **aviso de mesa** (activo/descartado),
compartido por toda la sala, y el propio marcado de la línea (`estado`/`listo_en`, ya
previsto en el esquema compartido).

Enfoque técnico: una vista web de sala (React + Chakra UI) que obtiene la instantánea por
la API HTTP de Express y la mantiene al día mediante **Server-Sent Events (SSE)** nativos
del navegador sobre el **hub SSE compartido** del repositorio (`backend/src/realtime/hub.js`),
de modo que todos los clientes conectados reciben el mismo evento; al descartar un aviso se
emite un evento de difusión que lo retira de todas las pantallas. No hay inicio de sesión ni
asignación de mesas por camarero: todas las mesas son compartidas (FR-011). La aplicación
exige conexión; al perderse muestra un indicador de "sin conexión", marca los datos como no
actualizados y se resincroniza al recuperarla (FR-014). La vista solo muestra los platos de
la **comanda ya enviada a cocina** (FR-001) y la señal sonora del aviso está activada por
defecto, con un control para silenciarla/reactivarla (FR-006).

La vista de sala muestra **todas las mesas abiertas** —aquellas con comanda en curso o ya
enviada a cocina y cuya cuenta no se ha cerrado— (FR-001, FR-011); las mesas con la comanda
aún en curso aparecen sin platos marcables y no generan aviso. La completitud de la mesa se
**recalcula** con el mismo criterio tras cualquier cambio en los platos enviados, incluida la
**edición de una comanda ya enviada** (añadir, cambiar o retirar un plato, historia 02): los
platos listos que no se tocan siguen listos y un plato nuevo pendiente retira el aviso hasta
que se marque como listo (FR-013).

El recálculo tras una edición **no se dispara en cada añadir/cambiar/retirar**, sino al
confirmar los cambios de una comanda ya enviada, es decir en el punto de integración real de la
historia 002: `POST /api/pedidos/:pedidoId/enviar-cambios` (`backend/src/routes/pedidos.js`),
que ya agrupa el pedido actualizado y publica en el hub compartido. Ese punto se amplía para
recalcular la completitud de la mesa y emitir los eventos de sala correspondientes. Al
**cerrarse la cuenta** de una mesa (historia 06) con un aviso activo, el aviso se **retira** y
deja de mostrarse en todas las pantallas, junto con la desaparición de la mesa de la vista
(FR-010); como el cierre de cuenta pertenece a la historia 06, esta historia deja el criterio de
"mesa abierta" y la retirada del aviso preparados para que aquélla los use (mesa no abierta ⇒
sin aviso), sin implementar aquí el cierre.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022, módulos ES) sobre Node.js 22 LTS; frontend React 18 (JSX).

**Dependencias principales** (las ya presentes en el repositorio; no se añade ninguna):
React 18 + Chakra UI (única librería de componentes de UI), React Router (enrutado ya
existente), ExpressJS 4 (API HTTP), `EventSource` nativo del navegador para tiempo real,
SQLite con el cliente `better-sqlite3`, y `zod` para validar los datos de entrada.

**Almacenamiento**: SQLite en fichero persistido en un volumen Docker, consultado con SQL
sencillo mediante `better-sqlite3`; migraciones versionadas en `backend/migrations/`. El
esquema compartido `001_init.sql` ya define `mesas`, `pedidos`, `lineas_pedido`
(con `estado` y `listo_en`) y la tabla `avisos` (activo/descartado); esta historia **no
necesita ninguna migración nueva** y no modifica el esquema base.

**Pruebas**: Backend Vitest + Supertest; Frontend Vitest + React Testing Library.

**Plataforma objetivo**: Aplicación web (navegador en tablet/PC de sala) más servidor Node;
ejecución reproducible con Docker (Linux).

**Tipo de proyecto**: Aplicación web con frontend y backend separados.

**Objetivos de rendimiento**: un cambio de estado se ve en ≤ 5 s (SC-002/FR-004);
resincronización tras reconexión en ≤ 10 s (SC-008); identificar los platos listos en ≤ 2 s
(SC-001); descartar el aviso en ≤ 2 s (SC-005); el descarte se refleja en todas las pantallas
en ≤ 5 s (SC-009).

**Restricciones**: requiere conexión a la red del restaurante (FR-014); UI solo con Chakra UI;
sin frameworks adicionales sin enmienda; todos los textos en español de España; arranque
reproducible con Docker.

**Convenciones de nombres (coherencia con el repositorio)**:
- **Eventos SSE**: se usa la convención ya existente en `backend/src/realtime/emit.js` y
  `backend/src/realtime/hub.js` — `punto.minuscula` (`linea.actualizada`, `pedido.nuevo`,
  `pedido.modificado`) —, **no** `kebab-case`. Los eventos nuevos de esta historia son
  `linea.actualizada` (reutilizado), `aviso.activo`, `aviso.retirado` y `aviso.descartado`.
  La constante de ruta de la vista (`/api/sala`, claves del cuerpo HTTP) sí puede usar
  `kebab-case`, como ya hace `descartar`-style en el resto de la API.
- **Claves JSON**: las respuestas y los cuerpos siguen la convención **`snake_case`** ya
  presente en la API (`pedido_id`, `por_partida`, `plato_nombre`), no *camelCase*. Los nuevos
  campos usan `snake_case` (`mesa_id`, `plato_id`, `aviso_id`, `generado_en`, `descartado_en`,
  `marcado_en`); los `data` de los eventos SSE siguen la convención ya usada (`linea.actualizada`
  publica `{ pedidoId, lineaId, estado }` en *camelCase*), por lo que se documentan tal cual en
  `contracts/api.md`.

**Escala/Alcance**: un único restaurante; decenas de mesas abiertas y un puñado de pantallas
concurrentes (sala y cocina). Alcance de esta historia: una vista de sala con estado en vivo,
avisos por mesa y el mecanismo mínimo de marcado de platos.

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|------------|--------|
| I. Simplicidad ante todo | Vista + API + SSE reutilizando el hub compartido; sin capas, ni gestor de estado global, ni ORM, sin migración nueva | Pasa |
| II. Español de España y euro | Todos los textos de la vista en español; sin importes en esta historia | Pasa |
| III. Cero alcance fantasma | Solo lo especificado (FR-001…FR-016): estado de platos, aviso, descarte global, sin conexión y el mecanismo mínimo de marcado (FR-016), sin la pantalla ni el aviso temporal de la 004 | Pasa |
| IV. Verificable por no técnico | Comprobable desde la interfaz (marcar → ver en sala; aviso y su sonido; descarte) | Pasa |
| V. Datos con respeto | Sin datos personales más allá de la identidad ya existente; secretos por variables de entorno, nunca en el repo | Pasa |
| VI. Conventional Commits | Proceso de commits del equipo; no afecta al diseño | Pasa |
| VII. Desarrollo en equipo | Docker, README de arranque y decisiones documentadas en el repo | Pasa |
| Tecnología obligatoria | React + Chakra UI (frontend), ExpressJS sobre Node (backend); no se añaden frameworks ni dependencias | Pasa |
| Contenedores (Docker) | `docker-compose` levanta frontend y backend (SQLite en volumen); ya existente | Pasa |
| Calidad y pruebas | Cada tarea incluye pruebas automatizadas junto al desarrollo | Pasa |
| Flujo de trabajo (Git Flow) | Feature parte de `develop` y vuelve por Pull Request | Pasa |

**Resultado (pre-diseño)**: sin violaciones. No se requiere Complexity Tracking.

**Resultado (post-diseño, tras Fase 1)**: se mantiene sin violaciones; SSE y `better-sqlite3` son
librerías/nativos ya presentes, no frameworks nuevos, por lo que no rompen la Tecnología obligatoria.

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

La estructura de abajo refleja el **repositorio real** (esqueleto base ya implementado con
las historias 001–003); esta historia añade o amplía los ficheros marcados con `(005)`.

```text
backend/
├── migrations/                # Migraciones SQL versionadas (001_init.sql ya incluye `avisos`)
├── src/
│   ├── app.js                 # Express app (middleware + rutas)  (005: monta /api/sala)
│   ├── server.js              # Arranque HTTP y cierre ordenado
│   ├── config.js              # Puerto, ruta de BD y CORS
│   ├── db/
│   │   ├── index.js           # Conexión a SQLite (better-sqlite3) + runner de migraciones
│   │   ├── mesas.js           # Acceso a mesas  (005: consulta de mesas abiertas con platos)
│   │   ├── pedidos.js         # Acceso a pedidos y líneas
│   │   └── avisos.js          # (005) Acceso a la tabla `avisos`
│   ├── domain/
│   │   └── avisos.js          # (005) Reglas de completitud y ciclo de vida del aviso
│   ├── realtime/
│   │   ├── hub.js             # Hub SSE compartido (alta/baja de clientes y difusión)
│   │   └── emit.js            # (005) Emisores de los eventos de sala/avisos
│   ├── middleware/
│   │   ├── camarero.js        # Identificación del camarero (X-Camarero-Id)
│   │   └── error.js           # Manejo de errores (ErrorHttp)
│   ├── schemas/               # (005) Validación de entrada (zod)
│   ├── routes/
│   │   ├── sala.js            # (005) GET /api/sala/mesas y POST /api/sala/avisos/:id/descartar
│   │   ├── lineas.js          # (005) PUT /api/pedidos/:pedidoId/lineas/:lineaId/estado (marcar/deshacer)
│   │   └── pedidos.js         # (005) existente (historia 002): en `enviar-cambios`, recálculo de la
│   │                          #       completitud de la mesa y emisión de eventos de sala (FR-013)
│   └── services/
│       ├── verPedidos.js      # Servicio existente (cocina, historia 003)
│       ├── salaMesas.js       # (005) Instantánea de la sala (mesas abiertas, platos enviados, avisos)
│       ├── avisos.js          # (005) Completitud, creación/retirada y descarte del aviso
│       └── estadoLinea.js     # (005) Marcar/deshacer una línea como lista (FR-016)
└── tests/
    ├── ayuda.js               # Arnés de pruebas (app + BD en memoria + cliente SSE falso)
    ├── contract/              # Contratos de API (Supertest)  (005: sala, avisos, estado de línea)
    ├── integration/           # Flujos en vivo (005: marcado → aviso, descarte global)
    └── unit/                  # Completitud, reversibilidad, idempotencia del descarte

frontend/
├── src/
│   ├── pages/
│   │   └── SalaEstado.jsx     # (005) Vista principal de mesas abiertas, estado y avisos
│   ├── components/
│   │   ├── MesaCard.jsx       # (005) Mesa con su relación de platos
│   │   ├── PlatoEstado.jsx    # (005) Indicador pendiente/listo
│   │   ├── AvisoMesa.jsx      # (005) Señal visual destacada + acción de descartar
│   │   ├── EstadoVacio.jsx    # (005) existente: reutilizado para "No hay mesas abiertas" (FR-015)
│   │   ├── EstadoCarga.jsx    # (005) existente: reutilizado como indicador de carga (FR-015)
│   │   └── AvisoSinConexion.jsx # (005) existente: reutilizado para el estado "sin conexión" (FR-014)
│   ├── hooks/
│   │   └── useSala.js         # (005) Estado de mesas + suscripción SSE + reconexión
│   ├── services/
│   │   ├── api.js             # Cliente HTTP (fetch) existente  (005: funciones de sala)
│   │   └── realtime.js        # Envoltorio de EventSource existente  (005: canal de sala)
│   └── utils/
│       └── sonido.js          # (005) Señal sonora del aviso (una vez) y control de silencio
└── tests/
    ├── components/            # (005) Distinción visual, estado vacío/carga, aviso
    ├── hooks/                 # (005) Suscripción SSE, reconexión y recálculo del estado
    └── integration/           # (005) Flujo en vivo, control de sonido y descarte global
```

**Decisión de estructura**: se mantiene la opción "Web application" (frontend + backend
separados), coherente con la Tecnología obligatoria de la constitución y con el esqueleto
base ya presente. El backend ExpressJS añade una ruta de sala que agrupa la instantánea y el
descarte de avisos, reutiliza el **hub SSE compartido** (`realtime/hub.js`) para difundir los
eventos y usa `zod` para validar la entrada del marcado de líneas. Además, amplía el punto de
integración ya existente de la historia 002 (`routes/pedidos.js`, `enviar-cambios`) para
recalcular la completitud tras una edición (FR-013), y amplía `db/mesas.js` para reunir por mesa
el pedido enviado (líneas visibles) y detectar la comanda en curso. El frontend React + Chakra UI
añade la vista de sala (en una ruta propia para no chocar con la pantalla de comandas existente)
y reutiliza los clientes HTTP y `EventSource` ya existentes, así como los componentes de estado
ya presentes (`EstadoVacio.jsx`, `EstadoCarga.jsx`, `AvisoSinConexion.jsx`) en lugar de
duplicarlos. Las entidades Mesa/Plato/Pedido pertenecen a las historias 01–04 y aquí solo se leen
(salvo el estado de la línea, que esta historia pasa a `listo`/`pendiente` por FR-016).

## Seguimiento de Complejidad

> **Rellena SOLO si la Verificación de la Constitución tiene violaciones que justificar**

No hay violaciones: la solución usa únicamente el stack obligatorio, reutiliza el hub SSE y el
esquema compartido ya existentes y no introduce complejidad anticipada.
