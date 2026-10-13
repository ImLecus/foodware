# Plan de Implementación: Editar un pedido enviado

**Rama**: `002-editar-comanda` | **Fecha**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/002-editar-comanda/spec.md`

**Nota**: Este fichero lo genera el comando `/speckit.plan`; su definición describe el flujo de ejecución.

## Resumen

El camarero reabre directamente un pedido ya enviado y lo modifica sobre la marcha (añadir,
retirar y ajustar platos e indicaciones), sin crear un pedido nuevo. Los cambios se aplican sobre
el pedido original, que queda **marcado como modificado** y vinculada a la misma mesa. Los cambios
no se comunican a cocina solos: el camarero debe ejecutar explícitamente **"enviar cambios"**.
Mientras un camarero edita el pedido, este queda **bloqueado** para los demás. El enfoque técnico
reutiliza el stack y la infraestructura de la historia 001 (React + Chakra UI, ExpressJS,
SQLite, Docker) y añade el estado de modificación, el registro de cambios, el bloqueo de
edición y el envío explícito de cambios, que se publica por SSE (hub compartido del proyecto).

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 20 (frontend y backend)

**Dependencias principales**: Frontend: React 18, Chakra UI, Vite. Backend: ExpressJS 4,
`better-sqlite3`, `zod`, `cors`. Tiempo real: Server-Sent Events (`EventSource` / hub compartido).
Pruebas: Vitest, React Testing Library, Supertest. (Idénticas a la historia 001.)

**Almacenamiento**: SQLite (fichero persistido en un volumen Docker), `better-sqlite3`, migraciones SQL versionadas. Se amplía el
esquema de la historia 001 (pedido, línea de pedido) y se añade la tabla de modificaciones.

**Pruebas**: Vitest (unitarias e integración), React Testing Library (sala) y Supertest (API).

**Plataforma objetivo**: Aplicación web en navegador (tabletas de sala) sobre la red local; backend
Node.js en Docker.

**Tipo de proyecto**: Aplicación web (frontend + backend) en el mismo repositorio, **construida sobre
la base de la historia 001**.

**Objetivos de rendimiento**: guardar una edición con retorno del servidor en < 1 s en la red local;
adquirir/liberar el bloqueo de edición en < 500 ms; "enviar cambios" en < 1 s.

**Restricciones**: Exige conexión (sin offline); interfaz en español de España y precios en euros;
entorno reproducible con Docker; ningún secreto en el repositorio.

**Escala/Alcance**: Un único restaurante; decenas de mesas; ~4 camareros; edición de pedidos ya
enviadas; versión 1.

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|--------------|--------|
| I. Simplicidad | Reutiliza la base de la 001; solo añade modificación, registro de cambios, bloqueo y envío explícito; sin capas extra | Pasa |
| II. Español de España y euro | UI y mensajes en español; importes en € | Pasa |
| III. Cero alcance fantasma | Solo FR-001…FR-015; cocina, listos, señales, cierre, dashboard y carta quedan fuera | Pasa |
| IV. Verificable por no técnica | `quickstart.md` valida desde la interfaz | Pasa |
| V. Datos con respeto | Solo identidad del camarero y datos del pedido/modificación; secretos por variables de entorno | Pasa |
| VI. Conventional Commits | Aplicable en la fase de implementación | Pasa |
| VII. Desarrollo en equipo | Estructura y arranque reproducibles con Docker; decisiones en `research.md` | Pasa |
| Tecnología obligatoria | React + Chakra UI; ExpressJS sobre Node.js (mismo stack que la 001) | Pasa |
| Contenedores (Docker) | Reutiliza el `docker-compose.yml` de la 001 | Pasa |
| Calidad y pruebas | Pruebas automatizadas junto al desarrollo (Vitest/RTL/Supertest) | Pasa |
| Flujo de trabajo (Git Flow) | Parada por tarea y commit; PR revisado | Pasa |

No hay violaciones. El **Seguimiento de Complejidad** no aplica.

## Estructura del Proyecto

### Documentación (esta funcionalidad)

```text
specs/002-editar-comanda/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Código fuente (raíz del repositorio)

Se parte de la estructura creada en la historia 001 y se añaden los ficheros de esta historia.

```text
backend/
├── src/
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── camarero.js       # identidad (historia 001)
│   │   │   └── bloqueo.js        # comprobación del bloqueo de edición
│   │   ├── mesas.js              # historia 001
│   │   ├── platos.js             # historia 001
│   │   └── pedidos.js           # se amplía: edición, bloqueo y enviar-cambios
│   ├── domain/
│   │   ├── pedidos.js           # historia 001
│   │   └── edicion.js            # reglas de edición, marcado y envío de cambios
│   ├── db/
│   │   ├── db.js               # historia 001
│   │   ├── pedidos.js           # se amplía: estado, modificada, cambios_pendientes, bloqueo
│   │   └── modificaciones.js     # registro de cambios (trazabilidad)
│   ├── schemas/
│   │   └── edicion.js            # validación zod de la edición
│   ├── realtime/                 # hub SSE compartido (proyecto)
│   │   └── hub.js
│   ├── app.js
│   └── index.js
├── migrations/                   # nueva migración: modificada, cambios_pendientes, bloqueo, modificaciones
└── tests/                        # edicion.*.test.js (API)

frontend/
├── src/
│   ├── components/
│   │   ├── Pedido.jsx           # historia 001 (se reutiliza)
│   │   ├── EditorPedido.jsx     # edición de un pedido enviado
│   │   └── EnviarCambios.jsx     # acción explícita "enviar cambios"
│   ├── pages/
│   │   └── Mesas.jsx             # historia 001 (se reutiliza)
│   ├── services/
│   │   ├── api.js                # se amplía: editar, bloqueo, enviar-cambios
│   │   └── realtime.js           # suscripción SSE
│   └── utils/formato.js          # historia 001
└── tests/                        # edicion.test.jsx
```

**Decisión de estructura**: misma aplicación web de dos paquetes (`backend/`, `frontend/`) de la 001; se
amplían ficheros existentes y se añaden los específicos de la edición. Sin paquetes ni capas nuevas.

## Seguimiento de Complejidad

> **Rellena SOLO si la Verificación de la Constitución tiene violaciones que justificar**

No hay violaciones de la constitución; esta sección no aplica.
