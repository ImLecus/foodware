# Implementation Plan: Ver pedidos pendientes en cocina

**Branch**: `003-ver_pedidos` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-ver_pedidos/spec.md`

**Note**: el stack y la estructura del repositorio se comparten con el plan de `004-marcar_listos`
(primer plan del proyecto); este documento no los redefine, solo los aplica a esta historia.

## Summary

Ofrecer al cocinero una vista de cocina que muestre **solo** los pedidos pendientes de su partida,
ordenados por tiempo de espera (más antiguo primero, con desempate por orden de llegada), con el
tiempo transcurrido desde el envío, la mesa de origen y todos los platos con sus cantidades (los ya
listos, marcados). La vista se refresca en vivo sin recargar, muestra estados vacío y «sin partida»,
y señala cuándo se pierde la conexión. El enfoque técnico reutiliza React + Chakra UI (frontend),
ExpressJS sobre Node.js con SQLite (backend) y Server-Sent Events para el refresco en vivo.

## Technical Context

**Language/Version**: JavaScript ES2022 sobre Node.js 20 (backend) y navegador moderno (frontend)

**Primary Dependencies**: React 18 + Chakra UI (frontend); ExpressJS 4 (backend); Vite (build);
better-sqlite3 (persistencia); Server-Sent Events vía `EventSource` (refresco en vivo);
Vitest + React Testing Library + Supertest (pruebas)

**Storage**: SQLite en fichero, persistido en un volumen Docker

**Testing**: Vitest (unitarias/integración backend), Supertest (contratos REST), React Testing
Library (componentes y flujos del frontend)

**Target Platform**: Aplicación web; backend Linux en contenedor; pantallas de cocina en navegador

**Project Type**: Aplicación web (frontend + backend en el mismo repositorio)

**Performance Goals**: un pedido nuevo aparece en la vista en ≤5 s sin recargar; la lista se
reordena en ≤5 s al cambiar el estado; el tiempo de espera se muestra con precisión ≥1 min

**Constraints**: UI en español de España; **requiere conexión** (al perderse se muestra indicador
de «sin conexión» y no se permite confirmar cambios hasta recuperarla); sin secretos en el
repositorio; arranque reproducible con `docker-compose`

**Scale/Scope**: un restaurante, 3 partidas, ~20 mesas, hasta ~20 pedidos pendientes por partida y
un puñado de pantallas de cocina concurrentes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicidad ante todo** — PASS. Un backend, un frontend, SQLite y SSE; la vista se resuelve
  con una lista ordenada en servidor y un temporizador en cliente, sin estado extra.
- **II. Idioma y mercado (español de España, euro)** — PASS. Toda la vista y el formato de tiempo
  van en español de España (FR-014); no maneja importes.
- **III. Cero alcance fantasma** — PASS. El plan cubre exactamente FR-001…FR-016; el indicador de
  «sin conexión» y el modo conectado proceden de una clarificación aprobada de la spec.
- **IV. Verificable por una persona no técnica** — PASS. `quickstart.md` permite demostrar cada
  escenario de aceptación desde la aplicación.
- **V. Datos del usuario con respeto** — PASS. Solo datos operativos del servicio; sin login nuevo
  (se reutiliza la identidad/asignación existente); sin secretos versionados.
- **VI. Conventional Commits obligatorios** — PASS. Afecta al flujo de trabajo del equipo, no al
  diseño técnico.
- **VII. Desarrollo en equipo** — PASS. Estructura monorepo y arranque con `docker-compose`
  documentados y reproducibles.
- **Tecnología obligatoria** — PASS. React + Chakra UI y ExpressJS sobre Node.js, sin alternativas.
- **Contenedores (Docker)** — PASS. Se reutilizan los `Dockerfile` y `docker-compose.yml` del plan
  compartido.
- **Calidad y pruebas** — PASS. Cada requisito funcional contará con pruebas automatizadas
  (Vitest + RTL + Supertest).

**Resultado**: sin violaciones; no se requiere justificación en Complexity Tracking.

**Re-check tras el diseño (Phase 1)**: sigue en PASS. Los contratos REST/SSE, el modelo de datos y
la guía de validación no añaden dependencias fuera del stack obligatorio y cubren todos los FR,
incluidos el estado sin partida, el estado vacío y el comportamiento sin conexión.

## Project Structure

### Documentation (this feature)

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

### Source Code (repository root)

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
│   └── realtime/            # canal SSE y emisión de eventos
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

**Structure Decision**: se mantiene la estructura de **aplicación web** del plan compartido
(`backend/` + `frontend/`). Para esta historia, el backend expone la lista ordenada de pendientes y
el canal SSE de la partida; el frontend concentra la pantalla de cocina y el aviso de conexión.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
