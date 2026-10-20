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

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/mesas` | Mesas con su estado y `pedido_en_curso_id` |
| `POST` | `/api/mesas/{mesaId}/abrir` | Abre la mesa y crea el pedido (`409` si ya hay uno) |
| `GET` | `/api/platos` | Carta vigente (platos disponibles) |
| `GET` | `/api/pedidos/{id}` | Pedido con líneas y `por_partida` |
| `POST` | `/api/pedidos/{id}/lineas` | Añade un plato con cantidad |
| `PATCH` | `/api/pedidos/{id}/lineas/{lineaId}` | Ajusta la cantidad |
| `DELETE` | `/api/pedidos/{id}/lineas/{lineaId}` | Retira el plato |
| `POST` | `/api/pedidos/{id}/confirmar` | Confirma y devuelve el pedido agrupado |
| `POST` | `/api/pedidos/{id}/anular` | Anula el pedido en curso y libera la mesa |

La identidad del camarero se toma de la cabecera `X-Camarero-Id` (por defecto `camarero-1`, que
existe en los datos de ejemplo); el inicio de sesión queda fuera del alcance de esta historia.
El contrato completo está en
[`specs/001-comandas/contracts/openapi.yaml`](specs/001-comandas/contracts/openapi.yaml) y la
validación manual en [`specs/001-comandas/quickstart.md`](specs/001-comandas/quickstart.md).

## Alcance actual

Este incremento implementa el **esqueleto compartido** (estructura, Docker, configuración, conexión
a SQLite, migración base, hub SSE, cliente HTTP/SSE, tema y rutas provisionales) y la **historia
001 (Sala: abrir mesa y tomar pedido)**. El resto de módulos (cocina, cuentas, dashboard y carta)
siguen mostrando su página provisional hasta que se implementen sus historias.
