# Plan de Implementación: Abrir mesa y tomar pedido

**Rama**: `feature/001-comandas` | **Fecha**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/001-comandas/spec.md`

**Nota**: Este fichero lo genera el comando `/speckit.plan`; su definición describe el flujo de ejecución.

## Resumen

El camarero abre una mesa ocupada y toma el pedido plato a plato, agrupada automáticamente por
partidas (entrantes, principales, postres). Puede ajustar cantidades y repetir platos mientras la
pedido está en curso; al confirmarlo, queda registrado como `enviada`, vinculado a su mesa y el
pedido se remite al resto del sistema ya ordenado por partidas. Si el cliente se marcha o cambia de
idea antes de confirmar, el camarero anula el pedido en curso: se descarta, la mesa vuelve a quedar
libre y nada se envía a cocina. El enfoque técnico es una
aplicación web con frontend React + Chakra UI y backend ExpressJS sobre Node.js con JavaScript,
persistencia en SQLite, todo reproducible con Docker. El estado de sala se refresca en vivo
mediante Server-Sent Events (SSE) sobre el hub compartido del proyecto. La identidad del camarero
se reutiliza de la sesión existente (la autenticación queda fuera del alcance de esta historia).

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 22 (frontend y backend)

**Dependencias principales**: Frontend: React 18, Chakra UI, Vite. Backend: ExpressJS 4,
`better-sqlite3`, `zod` (validación), `cors`. Tiempo real: Server-Sent Events (`text/event-stream`
en Express y `EventSource` nativo del navegador) sobre un hub compartido. Pruebas: Vitest, React
Testing Library, Supertest.

**Almacenamiento**: SQLite (fichero persistido en un volumen Docker), accedido con `better-sqlite3`; migraciones como ficheros SQL
versionados. Los importes se guardan como enteros en céntimos.

**Pruebas**: Vitest (unitarias e integración), React Testing Library (componentes de sala) y
Supertest (API del backend).

**Plataforma objetivo**: Aplicación web en navegador (tabletas de sala) sobre la red local del
restaurante; backend Node.js en contenedor Docker.

**Tipo de proyecto**: Aplicación web (frontend + backend) en un mismo repositorio.

**Objetivos de rendimiento**: Confirmar un pedido con retorno del servidor en < 1 s en la red local;
respuestas de API < 500 ms; sin recargas manuales para ver el estado.

**Restricciones**: Exige conexión a la red (sin funcionamiento offline); interfaz en español de
España y precios en euros (€); entorno reproducible con Docker; ningún secreto en el repositorio.

**Escala/Alcance**: Un único restaurante; decenas de mesas; ~4 camareros; 3 partidas fijas; versión 1.

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|--------------|--------|
| I. Simplicidad | Stack mínimo (React/Chakra + Express + SQLite), sin ORM ni capas; solo la historia 01 | Pasa |
| II. Español de España y euro | UI y mensajes en español; importes en € (`Intl.NumberFormat('es-ES')`) | Pasa |
| III. Cero alcance fantasma | Solo FR-001…FR-019; la anulación se limita a descartar el pedido en curso y liberar la mesa; edición, cocina, señales, cierre, dashboard y carta quedan fuera | Pasa |
| IV. Verificable por no técnica | `quickstart.md` valida desde la interfaz, sin leer código | Pasa |
| V. Datos con respeto | Solo identidad del camarero y datos del pedido; secretos por variables de entorno | Pasa |
| VI. Conventional Commits | Aplicable en la fase de implementación | Pasa |
| VII. Desarrollo en equipo | Estructura y arranque reproducibles con Docker; decisiones en `research.md` | Pasa |
| Tecnología obligatoria | React + Chakra UI; ExpressJS sobre Node.js | Pasa |
| Contenedores (Docker) | `Dockerfile` y `docker-compose.yml` para backend y frontend | Pasa |
| Calidad y pruebas | Pruebas automatizadas junto al desarrollo (Vitest/RTL/Supertest) | Pasa |
| Flujo de trabajo (Git Flow) | Parada por tarea y commit; PR revisado | Pasa |

No hay violaciones. El **Seguimiento de Complejidad** no aplica.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/001-comandas/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
backend/
├── src/
│   ├── api/             # rutas y controladores Express
│   │   ├── middleware/
│   │   │   └── camarero.js   # identidad del camarero (sesión existente)
│   │   ├── health.js
│   │   ├── mesas.js
│   │   ├── platos.js
│   │   └── pedidos.js
│   ├── domain/          # lógica de pedidos, agrupación por partidas y anulación
│   │   └── pedidos.js
│   ├── db/              # conexión y repositorios y consultas (better-sqlite3)
│   │   ├── db.js
│   │   ├── mesas.js
│   │   ├── platos.js
│   │   ├── pedidos.js   # incluye borrado del pedido y sus líneas al anular
│   │   └── seed.js
│   ├── schemas/         # validación de entrada (zod)
│   │   └── pedidos.js
│   ├── config.js        # configuración por variables de entorno
│   ├── realtime/        # hub SSE compartido (proyecto)
│   │   └── hub.js
│   ├── app.js           # composición de la app Express
│   └── index.js         # arranque del servidor
├── migrations/          # migraciones SQL versionadas
├── tests/               # integración de API (Supertest) y unitarias
├── Dockerfile
└── package.json

frontend/
├── src/
│   ├── components/      # piezas de UI (Chakra)
│   │   ├── Pedido.jsx        # incluye la acción "Anular pedido" antes de confirmar
│   │   ├── SelectorPlatos.jsx
│   │   └── Conexion.jsx      # indicador "sin conexión"
│   ├── pages/           # pantalla de sala: mesas, pedido en curso
│   │   └── Mesas.jsx         # refleja la mesa liberada tras la anulación
│   ├── services/        # cliente HTTP de la API y suscripción SSE
│   │   ├── api.js            # incluye anularPedido(pedidoId)
│   │   └── realtime.js
│   ├── theme/           # tema y localización Chakra (es-ES)
│   ├── utils/
│   │   └── formato.js        # formato de moneda/números es-ES
│   ├── App.jsx
│   └── main.jsx
├── tests/               # pruebas de componentes (React Testing Library)
├── Dockerfile
└── package.json

docker-compose.yml       # backend + frontend (SQLite en volumen)
```

**Decisión de estructura**: Aplicación web con dos paquetes (`backend/` y `frontend/`) en el mismo
repositorio, coherente con el stack obligatorio (React/Chakra en frontend, ExpressJS en backend) y
con el requisito de Docker (`docker-compose.yml` levanta los servicios). No se crean capas ni
paquetes adicionales (principio de simplicidad). La anulación se resuelve con una acción más en
`backend/src/api/pedidos.js` (`POST /pedidos/{pedidoId}/anular`) y un botón en `Pedido.jsx`; no
añade dependencias ni estados nuevos en el modelo (el pedido se borra y la mesa vuelve a `libre`).

## Seguimiento de Complejidad

> **Rellena SOLO si la Verificación de la Constitución tiene violaciones que justificar**

No hay violaciones de la constitución; esta sección no aplica.
