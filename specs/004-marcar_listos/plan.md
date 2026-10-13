# Plan de Implementación: Marcar platos como listos

**Rama**: `004-marcar_listos` | **Fecha**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/004-marcar_listos/spec.md`

## Resumen

Permitir al cocinero marcar (y deshacer) un plato de un pedido pendiente de su partida como
«listo» desde la pantalla de cocina, dejando constancia del momento de la marca y propagando el
cambio de estado a las pantallas de los camareros que atienden la mesa, sin recargar. El enfoque
técnico reutiliza el stack obligatorio de la constitución (React + Chakra UI en frontend, ExpressJS
sobre Node.js en backend, todo en Docker) y añade una capa mínima de persistencia SQLite y un canal
de eventos servidor→cliente (SSE) para el refresco en vivo.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 20 (backend) y navegador moderno (frontend)

**Dependencias principales**: React 18 + Chakra UI (frontend); ExpressJS 4 (backend); Vite (build del
frontend); better-sqlite3 (persistencia); Server-Sent Events vía `EventSource` (refresco en vivo);
Vitest + React Testing Library + Supertest (pruebas)

**Almacenamiento**: SQLite en fichero, persistido en un volumen Docker (una única instancia del backend)

**Pruebas**: Vitest (unitarias e integración del backend), Supertest (contratos de la API),
React Testing Library (componentes y flujos del frontend)

**Plataforma objetivo**: Aplicación web; backend Linux ejecutado en contenedor; clientes en navegador
(tablet/PC de cocina y de sala) dentro de la red del local

**Tipo de proyecto**: Aplicación web (frontend + backend en el mismo repositorio)

**Objetivos de rendimiento**: la marca de un plato se refleja en las pantallas de sala en ≤5 s (objetivo
SSE: casi inmediato); respuestas de la API de acciones <500 ms; decenas de clientes concurrentes

**Restricciones**: todo el texto visible en español de España; sin secretos en el repositorio;
arranque reproducible con `docker-compose`; sin frameworks adicionales fuera del stack obligatorio

**Escala/Alcance**: un restaurante, 3 partidas (entrantes, principales, postres), ~20 mesas, decenas
de pedidos por hora y un puñado de cocineros y camareros conectados a la vez

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|--------------|--------|
| I. Simplicidad | Un backend, un frontend y SQLite como único almacén; refresco en vivo con SSE | Pasa |
| II. Español de España y euro | UI y estados («pendiente», «listo») en español; no maneja importes | Pasa |
| III. Cero alcance fantasma | Solo los FR de la spec (marcar, deshacer, registrar, propagar) | Pasa |
| IV. Verificable por no técnica | `quickstart.md` demuestra cada escenario desde la aplicación | Pasa |
| V. Datos con respeto | Solo datos operativos del servicio; secretos por variables de entorno | Pasa |
| VI. Conventional Commits | Aplicable en la fase de implementación | Pasa |
| VII. Desarrollo en equipo | `docker-compose` y `quickstart.md` reproducibles | Pasa |
| Tecnología obligatoria | React + Chakra UI; ExpressJS sobre Node.js | Pasa |
| Contenedores (Docker) | `Dockerfile` de frontend y backend + `docker-compose.yml` | Pasa |
| Calidad y pruebas | Pruebas automatizadas por requisito (Vitest + RTL + Supertest) | Pasa |
| Flujo de trabajo (Git Flow) | Rama desde `develop`, PR revisado | Pasa |

**Resultado**: sin violaciones; no se requiere justificación en Complexity Tracking.

**Re-check tras el diseño (Phase 1)**: sigue en PASS. El modelo de datos, los contratos REST/SSE y
la guía de validación no introducen dependencias ni servicios fuera del stack obligatorio, y cada
requisito funcional queda cubierto por una prueba o por un escenario de la guía de validación.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

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

### Código fuente (raíz del repositorio)

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
│   └── realtime/            # suscripción al hub SSE compartido (`realtime/hub.js`)
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

**Decisión de estructura**: se elige la opción de **aplicación web** (frontend + backend en el mismo
repositorio), porque la constitución obliga a React + Chakra UI y a ExpressJS sobre Node.js y a un
arranque conjunto con Docker. El backend concentra persistencia (SQLite), reglas de marcado y
emisión de eventos; el frontend contiene las pantallas de cocina y sala. La raíz del repositorio
aloja el `docker-compose.yml` de arranque reproducible.

## Seguimiento de Complejidad

> Sin violaciones de la constitución; no aplica.
