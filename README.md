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
`pedido.nuevo`, `pedido.pendientes-cambiado`, `pedido.modificado`, `linea.actualizada`,
`pedido.reabierto`, `pedido-confirmado`, `pedido-anulado`, `aviso.activo`, `aviso.retirado`,
`aviso.descartado`, `mesa-cerrada`.

`GET /api/eventos` es el canal global (compatibilidad y pantallas de sala). La cocina usa
`GET /api/partidas/{partidaId}/eventos`: cada canal recibe solo los eventos de su partida. Si un
evento incluye `partida`, `publicar()` lo entrega al canal global y al canal de esa partida.

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
   líneas, deja la mesa `libre` y publica `pedido-anulado` y `pedido.pendientes-cambiado` para que
   cocina retire el pedido de sus canales de partida.
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
   **Enviar cambios**; entonces se publican `pedido.modificado` y
   `pedido.pendientes-cambiado` (además del evento heredado `pedido-modificado`).
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

El seed crea 20 mesas, un cocinero por partida y un cocinero sin partida
(`cocinero-sin-partida`), pedidos pendientes en las tres partidas, un pedido con más de una hora de
espera (`pedido-demo-6`) y dos pedidos con el mismo `enviadoEn` para comprobar el desempate por
identificador (`pedido-demo-7` y `pedido-demo-8`). Para el escenario sin partida:

```text
http://localhost:5173/cocina?cocinero=cocinero-sin-partida
```

La guía de validación y el mapa de requisitos están en
[`specs/003-ver_pedidos/quickstart.md`](specs/003-ver_pedidos/quickstart.md) y
[`specs/003-ver_pedidos/verification.md`](specs/003-ver_pedidos/verification.md).

## Cocina: marcar platos como listos (historia 004)

La pantalla de cocina (`/cocina?cocinero=cocinero-entrantes`) permite marcar cada plato como
**listo** o **deshacer** la marca. La completitud se calcula por **partida**: al marcar la última
línea pendiente de la partida del cocinero, el pedido desaparece de su lista y aparece un aviso
«Pedido completado» con la acción «Deshacer» durante 10 segundos. Si el pedido tiene líneas de otras
partidas, siguen pendientes en sus respectivas pantallas.

La pantalla de sala de una mesa está en `/sala/platos?mesa=mesa-1` y muestra el estado de los platos,
actualizándose por SSE sin recargar.

### API de la historia 004

| Método | Ruta                                              | Descripción                                        |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| `PUT`  | `/api/pedidos/{pedidoId}/lineas/{lineaId}/estado?partida={partida}` | Marca o deshace (`listo`/`pendiente`); exige la partida del cocinero |
| `GET`  | `/api/mesas/{mesaId}/estado-platos`               | Platos de la mesa con estado y `listoEn`           |
| `GET`  | `/api/mesas/{mesaId}/eventos`                      | Canal SSE de la mesa para la pantalla de sala      |

## Sala: señales de platos listos (historia 005)

La vista `/sala/estado` muestra todas las mesas abiertas con los platos de su comanda **ya
enviada** a cocina y el estado de cada uno (`Pendiente`/`Listo`). Se actualiza por SSE sin
recargar.

1. **Estado en vivo**: cada evento `linea.actualizada` refresca el plato correspondiente.
2. **Aviso de mesa completa**: cuando todos los platos enviados de una mesa están listos se
   muestra un aviso visual destacado con el nombre de la mesa y suena un pitido **una sola vez**.
   El aviso permanece visible hasta que se descarta.
3. **Sonido silenciable**: el control `Silenciar sonido`/`Activar sonido` está en el propio aviso;
   la preferencia se guarda en el navegador y la señal visual no se pierde al silenciarla.
4. **Descarte global**: `Descartar aviso` lo oculta en todas las pantallas y no reaparece hasta
   que se marque un nuevo plato como listo en esa mesa. Sin conexión la acción queda deshabilitada.
5. **Recálculo al editar**: al confirmar cambios de una comanda ya enviada se recalcula la
   completitud; un plato nuevo pendiente retira el aviso y, al marcarlo listo, se genera uno nuevo.
6. **Sin conexión**: se muestra el indicador de «sin conexión» y, al recuperarla, se resincroniza
   la instantánea de sala (estados de platos y avisos).

### API de la historia 005

| Método | Ruta                                              | Descripción                                                    |
| ------ | ------------------------------------------------- | -------------------------------------------------------------- |
| `GET`  | `/api/sala/mesas`                                 | Instantánea de mesas abiertas, platos y aviso activo           |
| `POST` | `/api/sala/avisos/{avisoId}/descartar`            | Descarta el aviso (idempotente; `404` si no existe)            |
| `PUT`  | `/api/pedidos/{pedidoId}/lineas/{lineaId}/estado` | Marca o deshace un plato (reutilizado de la historia 004)      |
| `POST` | `/api/pedidos/{pedidoId}/enviar-cambios`          | Recalcula la completitud al confirmar una edición              |

Eventos SSE propios: `aviso.activo`, `aviso.retirado` y `aviso.descartado`, además del ya
existente `linea.actualizada`. El contrato completo está en
[`specs/005-senales-platos-listos/contracts/api.md`](specs/005-senales-platos-listos/contracts/api.md)
y la validación manual en
[`specs/005-senales-platos-listos/quickstart.md`](specs/005-senales-platos-listos/quickstart.md).

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

### API de la historia 007 (Dashboard de estadísticas)

| Método | Ruta                | Descripción                                                       |
| ------ | ------------------- | ----------------------------------------------------------------- |
| `GET`  | `/api/reports/daily` | Informe diario con total, desgloses por camarero/plato y comparación con el día anterior. Requiere rol `encargado` vía cabecera `x-usuario-id`. |

Ruta frontend: `/dashboard` (protegida para `encargado`).

- Historia **007**: dashboard de estadísticas del servicio (total diario, desgloses por camarero/plato y comparación con día anterior).
- Historia **005**: estado de platos en vivo por mesa, aviso visual y sonoro de mesa completa,
  descarte global y recálculo al editar comandas ya enviadas.
- Las historias `006`–`008` siguen pendientes.
