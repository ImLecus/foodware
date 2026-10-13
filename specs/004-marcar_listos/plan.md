# Implementation Plan: Marcar platos como listos

**Branch**: `004-marcar_listos` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-marcar_listos/spec.md`

## Summary

Permitir al cocinero marcar (y deshacer) un plato de un pedido pendiente de su partida como
«listo» desde la pantalla de cocina, dejando constancia del momento de la marca y propagando el
cambio de estado a las pantallas de los camareros que atienden la mesa, sin recargar. El enfoque
técnico reutiliza el stack obligatorio de la constitución (React + Chakra UI en frontend, ExpressJS
sobre Node.js en backend, todo en Docker) y añade una capa mínima de persistencia SQLite y un canal
de eventos servidor→cliente (SSE) para el refresco en vivo.

## Technical Context

**Language/Version**: JavaScript ES2022 sobre Node.js 20 (backend) y navegador moderno (frontend)

**Primary Dependencies**: React 18 + Chakra UI (frontend); ExpressJS 4 (backend); Vite (build del
frontend); better-sqlite3 (persistencia); Server-Sent Events vía `EventSource` (refresco en vivo);
Vitest + React Testing Library + Supertest (pruebas)

**Storage**: SQLite en fichero, persistido en un volumen Docker (una única instancia del backend)

**Testing**: Vitest (unitarias e integración del backend), Supertest (contratos de la API),
React Testing Library (componentes y flujos del frontend)

**Target Platform**: Aplicación web; backend Linux ejecutado en contenedor; clientes en navegador
(tablet/PC de cocina y de sala) dentro de la red del local

**Project Type**: Aplicación web (frontend + backend en el mismo repositorio)

**Performance Goals**: la marca de un plato se refleja en las pantallas de sala en ≤5 s (objetivo
SSE: casi inmediato); respuestas de la API de acciones <500 ms; decenas de clientes concurrentes

**Constraints**: todo el texto visible en español de España; sin secretos en el repositorio;
arranque reproducible con `docker-compose`; sin frameworks adicionales fuera del stack obligatorio

**Scale/Scope**: un restaurante, 3 partidas (entrantes, principales, postres), ~20 mesas, decenas
de comandas por hora y un puñado de cocineros y camareros conectados a la vez

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicidad ante todo** — PASS. Un solo backend, un solo frontend y SQLite como único
  almacén; no se añaden capas ni servicios extra. El refresco en vivo se resuelve con SSE (canal
  unidireccional) en lugar de un bus de mensajes.
- **II. Idioma y mercado (español de España, euro)** — PASS. La UI y los estados («pendiente»,
  «listo») se escriben en español de España; esta historia no maneja importes.
- **III. Cero alcance fantasma** — PASS. El plan cubre solo los FR de la spec (marcar, deshacer,
  registrar el momento, propagar a sala), sin añadir marcado masivo ni estados intermedios.
- **IV. Verificable por una persona no técnica** — PASS. `quickstart.md` describe cómo demostrar
  cada escenario de aceptación usando la aplicación, sin leer código.
- **V. Datos del usuario con respeto** — PASS. Solo se almacenan datos operativos del servicio
  (partida, mesa, pedido y estado del plato); la configuración sensible va por variables de
  entorno y no se versiona ningún secreto.
- **VI. Conventional Commits obligatorios** — PASS. Se aplica al flujo de trabajo del equipo
  (no condiciona el diseño técnico).
- **VII. Desarrollo en equipo** — PASS. `docker-compose` y `quickstart.md` dejan el arranque
  documentado y reproducible en cualquier máquina.
- **Tecnología obligatoria** — PASS. React + Chakra UI y ExpressJS sobre Node.js, sin alternativas.
- **Contenedores (Docker)** — PASS. Se prevén `Dockerfile` de frontend y backend y un
  `docker-compose.yml` de arranque conjunto.
- **Calidad y pruebas** — PASS. Cada requisito funcional tendrá pruebas automatizadas
  (Vitest + RTL + Supertest) escritas junto a la funcionalidad.

**Resultado**: sin violaciones; no se requiere justificación en Complexity Tracking.

**Re-check tras el diseño (Phase 1)**: sigue en PASS. El modelo de datos, los contratos REST/SSE y
la guía de validación no introducen dependencias ni servicios fuera del stack obligatorio, y cada
requisito funcional queda cubierto por una prueba o por un escenario de la guía de validación.

## Project Structure

### Documentation (this feature)

```text
specs/004-marcar_listos/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── openapi.yaml
│   └── events.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.js               # construcción de la app Express
│   ├── server.js            # arranque HTTP
│   ├── config/              # configuración (puerto, ruta de la BD) por entorno
│   ├── db/                  # conexión SQLite y migraciones/seed
│   ├── models/              # acceso a partidas, mesas, pedidos y líneas de pedido
│   ├── services/            # reglas de negocio (marcar/deshacer listo)
│   ├── routes/              # endpoints REST (contratos de contracts/openapi.yaml)
│   └── realtime/            # canal SSE y emisión de eventos
├── tests/
│   ├── contract/
│   ├── integration/
│   └── unit/
├── Dockerfile
└── package.json

frontend/
├── src/
│   ├── main.jsx             # punto de entrada
│   ├── App.jsx              # enrutado y proveedor de Chakra UI
│   ├── pages/               # pantalla de cocina y pantalla de sala
│   ├── components/          # tarjeta de pedido, línea de plato, botón marcar/deshacer
│   ├── services/            # cliente REST y suscripción SSE
│   └── state/               # estado de la vista (pedidos y estados de plato)
├── tests/
├── Dockerfile
└── package.json

docker-compose.yml           # levanta frontend y backend; volumen para la BD SQLite
```

**Structure Decision**: se elige la opción de **aplicación web** (frontend + backend en el mismo
repositorio), porque la constitución obliga a React + Chakra UI y a ExpressJS sobre Node.js y a un
arranque conjunto con Docker. El backend concentra persistencia (SQLite), reglas de marcado y
emisión de eventos; el frontend contiene las pantallas de cocina y sala. La raíz del repositorio
aloja el `docker-compose.yml` de arranque reproducible.

## Complexity Tracking

> Sin violaciones de la constitución; no aplica.
