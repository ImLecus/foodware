# Plan de Implementación: Ver pedidos pendientes en cocina

**Rama**: `003-ver_pedidos` | **Fecha**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/003-ver_pedidos/spec.md`

**Nota**: el stack y la estructura del repositorio se comparten con el plan de `004-marcar_listos`
(primer plan del proyecto); este documento no los redefine, solo los aplica a esta historia.

## Resumen

Ofrecer al cocinero una vista de cocina que muestre **solo** los pedidos pendientes de su partida,
ordenados por tiempo de espera (más antiguo primero, con desempate por orden de llegada), con el
tiempo transcurrido desde el envío, la mesa de origen y todos los platos con sus cantidades (los ya
listos, marcados). La vista se refresca en vivo sin recargar, muestra estados vacío y «sin partida»,
y señala cuándo se pierde la conexión. El enfoque técnico reutiliza React + Chakra UI (frontend),
ExpressJS sobre Node.js con SQLite (backend) y Server-Sent Events para el refresco en vivo.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 20 (backend) y navegador moderno (frontend)

**Dependencias principales**: React 18 + Chakra UI (frontend); ExpressJS 4 (backend); Vite (build);
better-sqlite3 (persistencia); Server-Sent Events vía `EventSource` (refresco en vivo);
Vitest + React Testing Library + Supertest (pruebas)

**Almacenamiento**: SQLite en fichero, persistido en un volumen Docker

**Pruebas**: Vitest (unitarias/integración backend), Supertest (contratos REST), React Testing
Library (componentes y flujos del frontend)

**Plataforma objetivo**: Aplicación web; backend Linux en contenedor; pantallas de cocina en navegador

**Tipo de proyecto**: Aplicación web (frontend + backend en el mismo repositorio)

**Objetivos de rendimiento**: un pedido nuevo aparece en la vista en ≤5 s sin recargar; la lista se
reordena en ≤5 s al cambiar el estado; el tiempo de espera se muestra con precisión ≥1 min

**Restricciones**: UI en español de España; **requiere conexión** (al perderse se muestra indicador
de «sin conexión» y no se permite confirmar cambios hasta recuperarla); sin secretos en el
repositorio; arranque reproducible con `docker-compose`

**Escala/Alcance**: un restaurante, 3 partidas, ~20 mesas, hasta ~20 pedidos pendientes por partida y
un puñado de pantallas de cocina concurrentes

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|--------------|--------|
| I. Simplicidad | Un backend, un frontend, SQLite y SSE; lista ordenada en servidor y temporizador en cliente | Pasa |
| II. Español de España y euro | Vista y formato de tiempo en español; no maneja importes | Pasa |
| III. Cero alcance fantasma | Solo FR-001…FR-016; «sin conexión» procede de una clarificación aprobada | Pasa |
| IV. Verificable por no técnica | `quickstart.md` demuestra cada escenario desde la aplicación | Pasa |
| V. Datos con respeto | Solo datos operativos; sin login nuevo; sin secretos versionados | Pasa |
| VI. Conventional Commits | Aplicable en la fase de implementación | Pasa |
| VII. Desarrollo en equipo | Monorepo y arranque con `docker-compose` reproducibles | Pasa |
| Tecnología obligatoria | React + Chakra UI; ExpressJS sobre Node.js | Pasa |
| Contenedores (Docker) | `Dockerfile` y `docker-compose.yml` compartidos | Pasa |
| Calidad y pruebas | Pruebas automatizadas por requisito (Vitest + RTL + Supertest) | Pasa |
| Flujo de trabajo (Git Flow) | Rama desde `develop`, PR revisado | Pasa |

**Resultado**: sin violaciones; no se requiere justificación en Complexity Tracking.

**Re-check tras el diseño (Phase 1)**: sigue en PASS. Los contratos REST/SSE, el modelo de datos y
la guía de validación no añaden dependencias fuera del stack obligatorio y cubren todos los FR,
incluidos el estado sin partida, el estado vacío y el comportamiento sin conexión.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/003-ver_pedidos/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── openapi.yaml
│   └── events.md
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── app.js               # app Express y registro de rutas
│   ├── server.js            # arranque HTTP
│   ├── config/              # configuración (puerto, ruta de BD)
│   ├── db/                  # conexión SQLite y esquema
│   ├── models/              # partidas, usuarios, mesas, pedidos y líneas
│   ├── services/            # consulta de pedidos pendientes por partida y orden
│   ├── routes/              # endpoints REST (contracts/openapi.yaml)
│   │   ├── partidas.js      # lista de pedidos pendientes
│   │   └── cocineros.js     # partida del cocinero (identidad reutilizada)
│   └── realtime/            # suscripción al hub SSE compartido (`realtime/hub.js`)
├── tests/
│   ├── contract/
│   ├── integration/
│   └── unit/
├── Dockerfile
└── package.json

frontend/
├── src/
│   ├── main.jsx             # entrada y proveedor de Chakra UI
│   ├── App.jsx              # enrutado
│   ├── pages/
│   │   └── CocinaPage.jsx   # vista de cocina (lista de pendientes)
│   ├── components/          # PedidoCard, LineaPlato, TiempoEspera, EstadoVacio, AvisoSinConexion
│   ├── services/            # cliente REST y suscripción SSE
│   └── state/               # estado de la vista y temporizador del tiempo de espera
├── tests/
├── Dockerfile
└── package.json

docker-compose.yml           # frontend + backend; volumen para SQLite (compartido)
```

**Decisión de estructura**: se mantiene la estructura de **aplicación web** del plan compartido
(`backend/` + `frontend/`). Para esta historia, el backend expone la lista ordenada de pendientes y
el hub SSE compartido; el frontend concentra la pantalla de cocina y el aviso de conexión.

## Seguimiento de Complejidad

> Sin violaciones de la constitución; no aplica.
