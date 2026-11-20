# Plan de Implementación: Editar un pedido enviado

**Rama**: `feature/002-editar-comanda` | **Fecha**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad en `/specs/002-editar-comanda/spec.md`

**Nota**: Este fichero lo genera el comando `/speckit.plan`; su definición describe el flujo de ejecución.

## Resumen

El camarero reabre directamente un pedido ya enviado y lo modifica sobre la marcha (añadir,
retirar y ajustar platos e indicaciones), sin crear un pedido nuevo. Los cambios se aplican sobre
el pedido original, que queda **marcado como modificado** y vinculada a la misma mesa. Los cambios
no se comunican a cocina solos: el camarero debe ejecutar explícitamente **"enviar cambios"**.
Mientras un camarero edita el pedido, este queda **bloqueado** para los demás y **también para
cocina**: cocina no puede marcar ni desmarcar sus platos hasta que la edición termine. El bloqueo se
libera al **enviar los cambios**, al **cancelar o salir de la edición** y **automáticamente tras un
periodo de inactividad** configurable (15 minutos por defecto), de modo que ningún pedido quede
bloqueado indefinidamente.

La historia incorpora además la **cancelación del pedido completo** ya enviado: se avisa a cocina,
desaparece de la vista y la mesa queda libre sin generar cobro. Si una línea ya marcada como lista
cambia de cantidad, sigue lista al bajar o mantener la cantidad y vuelve a pendiente al subir. Un
cambio de disponibilidad de la carta no retira platos de pedidos ya enviados. Cada modificación
queda registrada con tipo, momento y usuario. Si la cuenta ya tiene alguna parte pagada, la edición
se bloquea hasta deshacer los pagos (historia 006). El enfoque técnico reutiliza el stack y la
infraestructura de la historia 001 (React + Chakra UI, ExpressJS, SQLite, Docker) y añade el estado
de modificación, el registro de cambios, el bloqueo de edición con su caducidad, el estado
`cancelada`, el estado de línea (pendiente/listo) y el envío explícito de cambios, que se publica
por SSE (hub compartido del proyecto).

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 22 (frontend y backend)

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

### Mecanismo de bloqueo y liberación

- Al abrir un pedido `enviada`, `POST /pedidos/{id}/editar` toma el bloqueo y guarda en el propio
  pedido `editando_por`, `editando_desde`, `editando_ultima_actividad` y `bloqueo_expira_en`
  (última actividad + periodo de inactividad).
- El bloqueo se libera al **enviar los cambios**, al **cancelar o salir de la edición** y
  **automáticamente por inactividad**. La caducidad se comprueba de forma **perezosa** en cada
  operación que toca el pedido: si `bloqueo_expira_en` ya pasó, el bloqueo se considera libre y se
  limpia. No hay temporizadores ni procesos en segundo plano.
- El periodo de inactividad es configurable con la variable de entorno
  `BLOQUEO_INACTIVIDAD_MINUTOS` (por defecto **15**). La comprobación usa el reloj del servidor y
  columnas de SQLite ya previstas: **no añade dependencias**.
- Si otro camarero mantiene un bloqueo vigente, la API responde `423`; si el solicitante perdió su
  propio bloqueo por expiración, responde `409` con `codigo: bloqueo_expirado` y debe reabrir el
  pedido.
- **Alcance del bloqueo a cocina**: mientras el bloqueo esté vigente, las operaciones de cocina
  sobre las líneas de ese pedido (marcar/desmarcar listo, historia 004) se rechazan con `423` o
  `409`; al liberarse, cocina trabaja sobre el estado resultante de los cambios. La comprobación se
  hace en la misma capa de servicio que el bloqueo de edición.

## Decisiones de la clarificación 2026-11-03

- **Cancelación de pedido enviado (FR-016)**: `POST /pedidos/{id}/cancelar` pasa el pedido a
  `cancelada`, retira el pedido y sus líneas de las vistas de cocina/sala, libera la mesa si no
  tiene otra comanda y registra una modificación de tipo `cancelar`; no genera consumo ni cobro.
- **Bloqueo de edición extensible a cocina (FR-015)**: mientras `editando_por` esté vigente, la
  API de cocina no permite marcar ni desmarcar platos de ese pedido. Al liberar el bloqueo, cocina
  opera sobre el estado resultante.
- **Cantidad de una línea ya lista (FR-004)**: si la cantidad baja o se mantiene, la línea sigue
  `listo`; si sube, vuelve a `pendiente` y se borra `listo_en`. La completitud de la mesa se
  recalcula en 005.
- **Disponibilidad de la carta (FR-003)**: un cambio de disponibilidad no retira automáticamente
  platos de pedidos ya enviados; el camarero decide retirarlos o cancelar el pedido.
- **Indicaciones (FR-005)**: se crean al añadir la línea en 001 y aquí solo se corrigen.
- **Trazabilidad (FR-013)**: cada modificación guarda tipo, momento y usuario; la vista de cocina
  solo muestra el aviso «Modificado» (003).
- **Partes pagadas (006)**: si la cuenta tiene alguna parte pagada, la edición del pedido se
  bloquea; primero se deshacen los pagos y las partes vuelven a `pendiente`.
- **Impacto técnico**: migración de `pedidos` (`cancelada`, columnas de bloqueo ya previstas),
  `lineas_pedido` (`estado`, `listo_en`, `nombre_plato`, `partida_codigo`, `indicaciones`) y
  `modificaciones` (`camarero_id`, tipo `cancelar`). No se crean entidades nuevas.

## Verificación de la Constitución

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio / regla | Comprobación | Estado |
|-------------------|--------------|--------|
| I. Simplicidad | Reutiliza la base de la 001; solo añade modificación, registro de cambios, bloqueo con caducidad perezosa y envío explícito; sin capas ni dependencias extra | Pasa |
| II. Español de España y euro | UI y mensajes en español; importes en € | Pasa |
| III. Cero alcance fantasma | Solo FR-001…FR-016, incluida la cancelación completa del pedido, el alcance del bloqueo a cocina, la regla de cantidad de una línea lista, la disponibilidad sin retirada automática y la trazabilidad con usuario; la edición de la carta, las señales y el dashboard quedan fuera | Pasa |
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
│   │   │   └── bloqueo.js        # comprobación y caducidad del bloqueo de edición
│   │   ├── mesas.js              # historia 001
│   │   ├── platos.js             # historia 001
│   │   └── pedidos.js           # se amplía: edición, bloqueo, enviar-cambios y cancelar
│   ├── domain/
│   │   ├── pedidos.js           # historia 001
│   │   └── edicion.js            # reglas de edición, cancelación, línea lista, bloqueo y envío
│   ├── db/
│   │   ├── db.js               # historia 001
│   │   ├── pedidos.js           # estado, modificada, cancelada, bloqueo y líneas (estado/listo_en)
│   │   └── modificaciones.js     # registro de cambios con tipo, momento y usuario
│   ├── schemas/
│   │   └── edicion.js            # validación zod de la edición
│   ├── realtime/                 # hub SSE compartido (proyecto)
│   │   └── hub.js
│   ├── app.js
│   └── index.js
├── migrations/                   # nueva migración: modificada, cambios_pendientes, bloqueo (última actividad, expiración), modificaciones
└── tests/                        # edicion.*.test.js (API)

frontend/
├── src/
│   ├── components/
│   │   ├── Pedido.jsx           # historia 001 (se reutiliza; muestra estado de línea)
│   │   ├── EditorPedido.jsx     # edición de un pedido enviado
│   │   ├── EnviarCambios.jsx     # acción explícita "enviar cambios"
│   │   └── CancelarPedido.jsx    # cancelación completa con confirmación
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
