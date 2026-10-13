# Plan de Implementación: Cierre y división de cuenta

**Rama**: `006-cierre-cuenta-division` | **Fecha**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/006-cierre-cuenta-division/spec.md`

**Nota**: Este fichero lo genera el comando `/speckit.plan`; su definición describe el flujo de ejecución.

## Resumen

El camarero necesita cerrar la cuenta de una mesa: ver el importe total calculado a partir
de lo consumido con el precio fijado al pedir, dividir la cuenta (en partes iguales o según
el consumo de cada comensal), marcar cada parte como pagada y generar el ticket final con el
total y el desglose de cada parte. Al completarse el cobro, la mesa queda cerrada y rechaza
nuevas operaciones.

Enfoque técnico: un flujo web (React + Chakra UI) que consulta la cuenta por la API HTTP de
Express, compone la división en pantalla y confirma el cobro en **una única operación
transaccional**; al cerrar, el backend persiste la cuenta y sus partes, marca la mesa como
cerrada y avisa a la vista de sala (historia 005) reutilizando su canal de eventos. Se
reutiliza el stack ya fijado a nivel de proyecto (SQLite + `better-sqlite3`, JavaScript ES2022,
ExpressJS, React + Chakra UI, Docker y los mismos *runners* de pruebas). No se introduce
inicio de sesión (las mesas son compartidas) ni integración con terminales de pago.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript (ES2022) sobre Node.js 20 LTS; frontend React 18 (JSX).

**Dependencias principales**: React 18 + Chakra UI (única librería de componentes de UI),
ExpressJS 4 (API HTTP), SQLite con el cliente `better-sqlite3`. No requiere canal en tiempo real
propio; para avisar a la vista de sala reutiliza el hub SSE compartido del proyecto.

**Almacenamiento**: SQLite en fichero persistido en un volumen Docker, consultado con SQL sencillo mediante `better-sqlite3` y
migraciones versionadas. La historia 006 es propietaria de las tablas de cuenta, partes y
asignaciones de consumo; **lee** las mesas y las líneas de pedido de las historias 01–04 y
**cierra** la mesa (transición de estado) al confirmar el cobro, que es su propia operación.

**Pruebas**: Backend Vitest + Supertest (cálculo del total, redondeo, cierre y ticket);
Frontend Vitest + React Testing Library (resumen, división, ticket y estados de error).

**Plataforma objetivo**: Aplicación web (navegador en tablet/PC de sala) más servidor Node;
ejecución reproducible con Docker (Linux).

**Tipo de proyecto**: Aplicación web con frontend y backend separados.

**Objetivos de rendimiento**: cerrar la cuenta de una mesa en ≤ 2 min (SC-002); completar la
división entre varios comensales en ≤ 3 min (SC-006); calcular y mostrar el total y confirmar
el cierre en ≤ 2 s.

**Restricciones**: requiere conexión a la red del restaurante (suposición compartida con las
historias 01–04); los precios se usan con IVA incluido y sin desglose de impuestos (v1); UI
solo con Chakra UI; todos los textos en español de España y euro (€); arranque reproducible
con Docker.

**Escala/Alcance**: un único restaurante; decenas de mesas abiertas y un puñado de pantallas
concurrentes (sala y cocina). Alcance de esta historia: el flujo de cierre, la división y el
ticket. Fuera de alcance: impresión o entrega del ticket, terminales de pago, propinas,
descuentos, anulaciones parciales y reapertura de mesas cerradas.

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|------------|--------|
| I. Simplicidad ante todo | Un flujo + API HTTP; sin capas, ni gestor de estado global, ni ORM, ni borradores persistidos | Pasa |
| II. Español de España y euro | Todos los textos en español; importes en € con formato español | Pasa |
| III. Cero alcance fantasma | Solo lo especificado (total, división, pago por partes, ticket, bloqueo de mesa); sin impresión ni pasarelas de pago | Pasa |
| IV. Verificable por no técnico | Comprobable desde la interfaz (cerrar, dividir, marcar partes pagadas, ver ticket, mesa bloqueada) | Pasa |
| V. Datos con respeto | Solo la etiqueta de comensal necesaria para identificar una parte; secretos por variables de entorno, nunca en el repo | Pasa |
| VI. Conventional Commits | Proceso de commits del equipo; no afecta al diseño | Pasa |
| VII. Desarrollo en equipo | Docker, README de arranque y decisiones documentadas en el repo | Pasa |
| Tecnología obligatoria | React + Chakra UI (frontend), ExpressJS sobre Node (backend); no se añaden frameworks | Pasa |
| Contenedores (Docker) | `docker-compose` levanta frontend y backend (SQLite en volumen) | Pasa |
| Calidad y pruebas | Cada tarea incluye pruebas automatizadas junto al desarrollo | Pasa |
| Flujo de trabajo (Git Flow) | Feature parte de `develop` y vuelve por Pull Request | Pasa |

**Resultado (pre-diseño)**: sin violaciones. No se requiere Complexity Tracking.

**Resultado (post-diseño, tras Fase 1)**: se mantiene sin violaciones. `better-sqlite3` y el cliente HTTP
son librerías/nativos, no frameworks; no se añade tiempo real propio (se reutiliza el hub compartido de
la historia 005), respetando la Tecnología obligatoria y el Principio I.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/006-cierre-cuenta-division/
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
│   ├── app.js                     # Express app (middleware + montaje de rutas)
│   ├── server.js                  # Servidor HTTP; publica en el hub SSE compartido (`realtime/hub.js`)
│   ├── db.js                      # Conexión a SQLite (better-sqlite3) + runner de migraciones (compartido)
│   ├── migrations/
│   │   ├── 001_base.sql           # mesas y líneas de pedido (historias 01–04; NO propiedad de 006)
│   │   └── 002_cuentas.sql        # cuentas, cuentas_partes y cuentas_parte_consumos (006)
│   ├── middleware/
│   │   └── errores.js             # Manejo centralizado de errores (400/404/409/422/500)
│   ├── routes/
│   │   └── cuentas.js             # GET cuenta, POST cierre, GET ticket
│   ├── realtime/
│   │   └── eventos.js             # emite «mesa-cerrada» al hub compartido
│   └── services/
│       ├── cuentasService.js      # Cálculo del total y cierre transaccional
│       ├── divisionService.js     # Partes iguales (redondeo) y por consumo
│       └── ticketService.js       # Composición del ticket (total + partes)
├── scripts/
│   └── seed.js                    # Datos de ejemplo (mesa con consumos)
└── tests/
    ├── contract/                  # Contratos de API de cuenta, cierre y ticket (Supertest)
    ├── integration/               # Cierre, división, pago por partes y bloqueo de mesa
    └── unit/                      # Total, redondeo de céntimos, validación de la división

frontend/
├── src/
│   ├── App.jsx                    # Enrutado (compartido)
│   ├── main.jsx                   # Arranque (compartido)
│   ├── pages/
│   │   └── CierreCuenta.jsx       # Flujo de cierre: total, división y ticket
│   ├── components/
│   │   ├── ResumenCuenta.jsx      # Total y consumos de la mesa
│   │   ├── DivisionCuenta.jsx     # Elección de partes iguales o por consumo
│   │   ├── ParteCuenta.jsx        # Importe, comensal y estado de pago de una parte
│   │   ├── AsignarConsumos.jsx    # Asignación de platos/porciones a las partes
│   │   ├── TicketFinal.jsx        # Total y desglose de partes
│   │   └── SinConexion.jsx        # Indicador de «sin conexión» (compartido con 005)
│   ├── hooks/
│   │   └── useCuenta.js           # Carga la cuenta y gobierna el flujo de cierre
│   └── services/
│       ├── api.js                 # Llamadas HTTP (fetch) (compartido con 005)
│       └── formato.js             # Importes en € y números/fechas con formato español
└── tests/
    ├── components/                # Resumen, división y ticket
    └── integration/               # Flujo de cierre completo

docker-compose.yml                 # frontend + backend (SQLite en volumen) (compartido)
backend/Dockerfile
frontend/Dockerfile
```

**Decisión de estructura**: se elige la opción "Web application" (frontend + backend separados),
coherente con la Tecnología obligatoria de la constitución. El backend ExpressJS añade a la
API existente las rutas de cuenta y cierre; el frontend React + Chakra UI implementa el flujo
de cierre y las vistas de división y ticket. La base de datos SQLite se aprovisiona con
`docker-compose`.

**Frontera de alcance (propiedad de datos)**:

- **Propiedad de 006** (se crea y escribe aquí): `cuentas`, `cuentas_partes`,
  `cuentas_parte_consumos`.
- **Solo lectura** (propiedad de las historias 01–04): `mesas` y las líneas de pedido
  (consumos) con su precio fijado al pedir.
- **Transición de estado propia de 006**: marcar la mesa como cerrada al confirmar el cobro
  (la apertura de mesa pertenece a la historia 01).
- **Integración**: se reutiliza el hub SSE compartido del proyecto únicamente para emitir el
  evento `mesa-cerrada` (la vista de sala deja de mostrar la mesa); la historia 006 no
  introduce su propio canal de tiempo real.

## Seguimiento de Complejidad

> **Rellena SOLO si la Verificación de la Constitución tiene violaciones que justificar**

No hay violaciones: la solución usa únicamente el stack obligatorio y no introduce
complejidad anticipada.
