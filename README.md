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

## Alcance actual

- Esqueleto compartido: estructura, Docker, SQLite, hub SSE, cliente HTTP/SSE, tema y pruebas de
  humo.
- Historia **003 completa**: pedidos pendientes por partida, tiempo de espera, detalle de platos,
  marcado accesible, aviso «Modificado», actualización en vivo, sin conexión y reintento.
- Las historias `001`, `002` y `004`–`008` siguen pendientes.
