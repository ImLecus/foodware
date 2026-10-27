# Foodware · esqueleto base

Sistema de comandas para restaurante. Este repositorio contiene la **base compartida** para que
las 8 historias de la versión 1 puedan implementarse en paralelo por 4 personas.

## Stack

- **Frontend**: React 18 + Chakra UI, empaquetado con Vite.
- **Backend**: ExpressJS sobre Node.js 22, API HTTP y SSE para tiempo real.
- **Persistencia**: SQLite con `better-sqlite3` y migraciones SQL versionadas.
- **Pruebas**: Vitest + Testing Library (frontend) y Supertest (backend).
- **Entorno**: Docker y `docker-compose`.

## Estructura

```text
backend/
  migrations/          Migraciones SQL compartidas (001_init.sql)
  src/
    app.js             Construcción de la app Express (inyecta la BD)
    server.js          Arranque HTTP y cierre ordenado
    config.js          Puerto, ruta de BD y CORS
    db/                Conexión, migraciones y datos de referencia
    realtime/hub.js    Hub SSE compartido
    routes/            health y eventos
    middleware/        errores y 404
  tests/               Pruebas de API y del hub
frontend/
  src/
    App.jsx            Cabecera, navegación y rutas provisionales
    pages/             Inicio y páginas pendientes por módulo
    services/          Cliente HTTP y conexión SSE
    components/        Indicador de conexión
    theme/             Tema Chakra (es-ES)
    utils/             Formatos de euro, fecha y hora
  tests/               Pruebas de componentes
specs/                 Especificaciones, planes y tareas por historia
```

## Arranque rápido

```bash
docker compose up --build
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3000/api/health>
- SSE: <http://localhost:3000/api/eventos>

La primera vez se crea la base de datos en `backend/data/foodware.db` y se aplican las
migraciones. Para cargar datos de referencia (partidas, usuarios, mesas, carta e ingredientes):

```bash
docker compose exec backend npm run seed
```

### Arranque sin Docker

```bash
cd backend && npm install && npm run seed && npm run dev
cd frontend && npm install && npm run dev
```

El frontend usa `/api` por defecto y Vite lo redirige al backend en `localhost:3000`. También se
puede definir `VITE_API_URL` (ver `frontend/.env.example`).

## Comandos útiles

Desde la raíz:

```bash
npm test        # pruebas de backend y frontend
npm run lint    # ESLint en ambos paquetes
npm run format  # Prettier
npm run dev     # docker compose up --build
```

## API y tiempo real

- `GET /api/health` → estado del servicio y comprobación de la base de datos.
- `GET /api/eventos` → stream SSE. El hub compartido permite publicar eventos desde cualquier
  módulo:

```js
import { publicar } from './realtime/hub.js';
publicar('pedido-confirmado', { pedidoId: 'pedido-1' });
```

Los nombres de evento acordados en los contratos de las historias son, entre otros:
`pedido-confirmado`, `pedido-anulado`, `pedido.modificado`, `linea.actualizada`,
`pedido.reabierto`, `aviso-descartado`, `mesa-cerrada`.

## Base de datos compartida

`backend/migrations/001_init.sql` define el esquema base de todas las historias:

- Catálogo: `partidas`, `platos`, `ingredientes`, `plato_ingredientes`.
- Sala y pedidos: `mesas`, `pedidos`, `lineas_pedido`, `modificaciones`, `bloqueos_edicion`.
- Cobro: `cuentas`, `cuentas_partes`, `cuentas_parte_consumos`, `tickets`.
- Cocina: `avisos`.

Reglas para no pisarse entre historias:

1. **No modificar** `001_init.sql` una vez compartido. Cada historia añade su propia migración
   (`002_...sql`, `003_...sql`) con los cambios que necesite.
2. Los estados y nombres de columnas deben coincidir con `data-model.md` de cada historia.
3. Los importes se guardan en **céntimos** (enteros).
4. Las fechas se guardan en UTC con el formato de SQLite (`YYYY-MM-DD HH:MM:SS`).

## Trabajo en paralelo

Cada historia tiene su especificación, plan y tareas en `specs/00X-.../`. Para evitar conflictos:

- Cada persona trabaja en una rama `feature/00X-nombre` partiendo de `develop`.
- Las rutas del frontend ya están separadas por módulo (`/sala`, `/cocina`, `/cuentas`,
  `/dashboard`, `/admin`). Sustituye la página provisional de tu módulo, no la de los demás.
- El backend expone routers independientes: añade el tuyo en `backend/src/routes/` y móntalo en
  `app.js`.
- Los servicios de dominio y acceso a datos van en `src/services/` y `src/db/` respectivamente.
- Las pruebas de cada historia viven en `backend/tests/` y `frontend/tests/`.

## Convenciones del proyecto

- Textos visibles en **español de España** y precios en **euros** (`es-ES`).
- Commits en **Conventional Commits** (`feat(003): ...`).
- La constitución exige **parar tras cada tarea** de `tasks.md`, resumir lo hecho y esperar
  revisión y commit antes de continuar.
- Toda funcionalidad debe incluir pruebas automatizadas.

## Sala: abrir mesa y tomar pedido (historia 001)

La pantalla de sala (`/sala`) implementa el flujo completo de la historia 001:

1. **Abrir mesa**: al seleccionar una mesa libre aparece el botón «Abrir Mesa N». La mesa pasa a
   `ocupada` y se crea su pedido `en_curso`.
2. **Añadir platos**: desde la carta se añade cada plato con su cantidad; se permiten repeticiones.
3. **Agrupación automática**: el pedido se muestra agrupado en entrantes, principales y postres.
4. **Ajustar antes de confirmar**: se puede cambiar la cantidad o retirar cualquier línea.
5. **Confirmar**: el pedido pasa a `enviada`, queda vinculado a su mesa y se publica el evento SSE
   `pedido-confirmado` con el pedido agrupado por partidas.
6. **Anular**: con el pedido en curso, «Anular pedido» pide confirmación, elimina el pedido y sus
   líneas, deja la mesa `libre` y publica `pedido-anulado`. No se envía nada a cocina.
7. **Sin conexión**: si se pierde el SSE, la pantalla lo avisa y bloquea la edición y la
   confirmación, conservando lo anotado.

### API de la historia 001

| Método   | Ruta                                 | Descripción                                         |
| -------- | ------------------------------------ | --------------------------------------------------- |
| `GET`    | `/api/mesas`                         | Mesas con su estado y `pedido_en_curso_id`          |
| `POST`   | `/api/mesas/{mesaId}/abrir`          | Abre la mesa y crea el pedido (`409` si ya hay uno) |
| `GET`    | `/api/platos`                        | Carta vigente (platos disponibles)                  |
| `GET`    | `/api/pedidos/{id}`                  | Pedido con líneas y `por_partida`                   |
| `POST`   | `/api/pedidos/{id}/lineas`           | Añade un plato con cantidad                         |
| `PATCH`  | `/api/pedidos/{id}/lineas/{lineaId}` | Ajusta la cantidad                                  |
| `DELETE` | `/api/pedidos/{id}/lineas/{lineaId}` | Retira el plato                                     |
| `POST`   | `/api/pedidos/{id}/confirmar`        | Confirma y devuelve el pedido agrupado              |
| `POST`   | `/api/pedidos/{id}/anular`           | Anula el pedido en curso y libera la mesa           |

La identidad del camarero se toma de la cabecera `X-Camarero-Id` (por defecto `camarero-1`, que
existe en los datos de ejemplo); el inicio de sesión queda fuera del alcance de esta historia.
El contrato completo está en
[`specs/001-comandas/contracts/openapi.yaml`](specs/001-comandas/contracts/openapi.yaml) y la
validación manual en [`specs/001-comandas/quickstart.md`](specs/001-comandas/quickstart.md).

## Editar pedidos enviados (historia 002)

Sobre la pantalla de sala, al seleccionar un pedido en estado `enviada` aparece el botón
**Editar pedido**, que abre el editor:

1. **Edición directa**: no hay que "reabrir" nada; al entrar se toma el bloqueo de edición.
2. **Añadir, retirar y ajustar**: se pueden añadir platos de la carta, cambiar cantidades, corregir
   indicaciones y retirar líneas (nunca la última). Cada cambio se aplica al mismo pedido y a la
   misma mesa, y lo marca como **Modificada** con **Cambios pendientes**.
3. **Enviar cambios**: los cambios no se comunican a cocina hasta pulsar explícitamente
   **Enviar cambios**; entonces se publica el evento SSE `pedido-modificado`.
4. **Bloqueo**: solo un camarero puede editar el pedido a la vez. Si otro lo tiene, la API responde
   `423 pedido_bloqueado`. Si el bloqueo caduca por inactividad, al guardar se responde
   `409 bloqueo_expirado` y el editor ofrece **Reabrir edición**.
5. **Liberación**: el bloqueo se libera al enviar los cambios, al cancelar o salir del editor y
   automáticamente tras `BLOQUEO_INACTIVIDAD_MINUTOS` (15 por defecto) sin actividad.

### API de la historia 002

| Método   | Ruta                               | Descripción                                                    |
| -------- | ---------------------------------- | -------------------------------------------------------------- |
| `GET`    | `/api/pedidos/{id}/editar`         | Estado del bloqueo (`libre`, `bloqueado`, `expirado`)          |
| `POST`   | `/api/pedidos/{id}/editar`         | Toma el bloqueo (`423` si es de otro, `409` si no es editable) |
| `DELETE` | `/api/pedidos/{id}/editar`         | Libera el bloqueo (idempotente)                                |
| `POST`   | `/api/pedidos/{id}/enviar-cambios` | Comunica los cambios a cocina y libera el bloqueo              |
| `GET`    | `/api/pedidos/{id}`                | Incluye `modificada`, `cambios_pendientes` y el bloqueo        |

Los endpoints de líneas (`POST`/`PATCH`/`DELETE`) admiten pedidos `enviada` cuando el camarero
tiene el bloqueo. Detalles en
[`specs/002-editar-comanda/quickstart.md`](specs/002-editar-comanda/quickstart.md) y
[`specs/002-editar-comanda/contracts/openapi.yaml`](specs/002-editar-comanda/contracts/openapi.yaml).

## Verificación de la historia 003

```bash
docker compose up --build
docker compose exec backend npm run seed

# API
curl http://localhost:3000/api/cocineros/cocinero-entrantes
curl http://localhost:3000/api/partidas/entrantes/pedidos-pendientes
curl -N http://localhost:3000/api/partidas/entrantes/eventos

# Interfaz
# http://localhost:5173/cocina?cocinero=cocinero-entrantes

# Pruebas
npm test
```

La vista de cocina identifica al cocinero con `?cocinero=<id>` (por defecto
`cocinero-entrantes`). El canal SSE se abre por partida y refresca la lista sin recargar.

## Cocina: marcar platos como listos (historia 004)

La pantalla de cocina (`/cocina?cocinero=cocinero-entrantes`) permite marcar cada plato como
**listo** o **deshacer** la marca. Al completar el último plato de un pedido, el pedido desaparece y
aparece un aviso «Pedido completado» con la acción «Deshacer» durante 10 segundos.

La pantalla de sala de una mesa está en `/sala/platos?mesa=mesa-1` y muestra el estado de los platos,
actualizándose por SSE sin recargar.

### API de la historia 004

| Método | Ruta                                              | Descripción                                        |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| `PUT`  | `/api/pedidos/{pedidoId}/lineas/{lineaId}/estado` | Marca o deshace (`listo`/`pendiente`); idempotente |
| `GET`  | `/api/mesas/{mesaId}/estado-platos`               | Platos de la mesa con estado y `listoEn`           |

## Alcance actual

- Esqueleto compartido: estructura, Docker, SQLite, hub SSE, cliente HTTP/SSE, tema y pruebas de
  humo.
- Historia **001**: abrir mesa y tomar pedido, con anulación y sin conexión.
- Historia **002**: edición de pedidos enviados, bloqueo y envío explícito de cambios.
- Historia **003**: pedidos pendientes por partida, tiempo de espera, detalle de platos, marcado
  accesible, aviso «Modificado», actualización en vivo, sin conexión y reintento.
- Historia **004**: marcar/deshacer platos como listos, aviso «Pedido completado» con «Deshacer»,
  reflejo en sala y canal SSE.
- Las historias `005`–`008` siguen pendientes.
