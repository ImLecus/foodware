# Verificación — Esqueleto y autenticación por roles (000)

## 1. Base compartida

Comprobado desde un clon limpio con `docker compose up --build` y `docker compose exec backend npm run seed`.

Tras reiniciar la base local (`backend/data/foodware.db`) y ejecutar las migraciones y el seed:

| Tabla | Filas esperadas | Comprobación |
|---|---:|---|
| `partidas` | 3 | entrantes, principales y postres |
| `usuarios` | 8 | 2 camareros, 4 cocineros (3 con partida y 1 sin partida), 1 encargado y 1 administrador |
| `mesas` | 20 | mesas 1–20 |
| `platos` | 8 | carta de ejemplo |
| `pedidos` | 9 | 8 pedidos de cocina y 1 pedido enviado para edición |
| `cuentas` | 3 | cuentas cerradas de ejemplo para el dashboard |
| `sesiones` | 0 | las sesiones se crean al iniciar sesión |

Además, el seed deja 6 ingredientes y 7 asociaciones plato–ingrediente, y asigna
`password_hash` a los 8 usuarios demo con la contraseña `demo1234`.

Comando de comprobación usado:

```bash
cd backend
npm run seed
node --input-type=module - <<'NODE'
import { createDb } from './src/db/index.js';
const db = createDb();
for (const tabla of ['partidas', 'usuarios', 'mesas', 'platos', 'pedidos', 'cuentas', 'sesiones']) {
  console.log(tabla, db.prepare(`SELECT COUNT(*) AS n FROM ${tabla}`).get().n);
}
NODE
```

## 2. Suites automatizadas

Última ejecución local:

- Backend: **71 ficheros, 298 pruebas**, todas correctas.
- Frontend: **41 ficheros, 145 pruebas**, todas correctas.

```bash
npm test                 # desde la raíz: backend + frontend
npm --prefix backend run lint
npm --prefix frontend run lint
```

## 3. Mapa de requisitos funcionales

| Requisito | Evidencia |
|---|---|
| FR-001 monorepositorio | `README.md`, estructura `backend/`, `frontend/`, `specs/`; `tests/health.test.js` |
| FR-002 API y migraciones | `backend/src/db/index.js`, `backend/migrations/*.sql`, `tests/health.test.js` |
| FR-003 seed | `backend/src/db/seed.js`, `specs/000-esqueleto-autenticacion/verification.md` |
| FR-004 frontend Chakra y rutas | `frontend/src/App.jsx`, `frontend/src/theme/index.js`, `frontend/tests/App.test.jsx` |
| FR-005 SSE | `backend/src/realtime/`, `frontend/src/services/realtime.js`, `tests/contract/eventos-cocina.test.js` |
| FR-006 pruebas y documentación | ambas suites, `README.md`, `specs/000-esqueleto-autenticacion/` |
| FR-007 login con usuario y contraseña | `backend/tests/contract/auth.test.js`, `frontend/tests/auth/LoginPage.test.jsx` |
| FR-008 contraseñas no reversibles | `backend/tests/unit/auth-password.test.js`, `backend/tests/contract/auth-seguridad.test.js` |
| FR-009 error genérico sin sesión | `backend/tests/contract/auth.test.js`, `backend/tests/contract/auth-seguridad.test.js` |
| FR-010 sesión asociada al usuario | `backend/tests/unit/auth-sesiones.test.js`, `backend/tests/contract/auth.test.js` |
| FR-011 sesión persistente | `backend/tests/integration/auth-sesion.test.js`, `frontend/tests/auth/Sesion.test.jsx` |
| FR-012 logout revoca la sesión | `backend/tests/contract/auth.test.js`, `backend/tests/integration/auth-sesion.test.js` |
| FR-013 caducidad y 401 | `backend/tests/unit/auth-sesiones.test.js`, `backend/tests/integration/auth-sesion.test.js`, `frontend/tests/auth/SesionExpirada.test.jsx` |
| FR-014 roles reconocidos | `backend/src/middleware/authorize.js`, `backend/tests/contract/auth-roles.test.js` |
| FR-015 una partida por cocinero | `backend/src/db/seed.js`, `backend/tests/contract/auth-roles.test.js` |
| FR-016 identidad solo de sesión | `backend/src/middleware/autenticar.js`, `backend/tests/integration/auth-roles.test.js` |
| FR-017 401 sin sesión | `backend/tests/contract/auth-roles.test.js`, `frontend/tests/auth/RutaProtegida.test.jsx` |
| FR-018 403 sin permiso | `backend/tests/contract/auth-roles.test.js`, `frontend/tests/auth/RutaProtegida.test.jsx` |
| FR-019 menú y rutas por rol | `frontend/src/auth/rutas.js`, `frontend/tests/auth/MenuRol.test.jsx` |
| FR-020 camarero: sala y cuentas | `backend/tests/contract/auth-roles.test.js`, `frontend/tests/auth/MenuRol.test.jsx` |
| FR-021 cocinero: cocina de su partida | `backend/src/routes/partidas.js`, `backend/tests/contract/auth-roles.test.js`, `frontend/tests/pages/CocinaPage.test.jsx` |
| FR-022 encargado: dashboard | `backend/src/api/reportsRouter.js`, `backend/tests/contract/auth-roles.test.js` |
| FR-023 administrador: carta | `frontend/src/App.jsx`, `frontend/tests/auth/MenuRol.test.jsx` |
| FR-024 APIs con rol | `backend/src/routes/*.js`, `backend/src/api/reportsRouter.js`, `backend/tests/contract/auth-roles.test.js` |
| FR-025 SSE con sesión y rol | `backend/src/routes/events.js`, `backend/src/routes/partidas.js`, `backend/tests/contract/eventos-cocina.test.js`, `frontend/src/services/realtime.js` |
| FR-026 usuarios demo para todos los roles | `backend/src/db/seed.js`, `backend/tests/integration/auth-demo.test.js` |
| FR-027 sin secretos reales | `backend/src/auth/password.js`, `specs/000-esqueleto-autenticacion/quickstart.md` |
| FR-028 configuración por entorno | `backend/src/config.js`, `backend/.env.example` |
| FR-029 CORS con credenciales y origen de escritura | `backend/src/middleware/origen.js`, `backend/src/app.js`, `backend/tests/contract/auth-seguridad.test.js` |
| FR-030 comportamiento 001–008 | suites de regresión de backend y frontend adaptadas a cookies |

## 4. Mapa de criterios de éxito

| Criterio | Evidencia |
|---|---|
| SC-001 401 sin sesión | `auth-roles.test.js`, `RutaProtegida.test.jsx` |
| SC-002 403 sin permiso | `auth-roles.test.js`, `RutaProtegida.test.jsx` |
| SC-003 acceso en menos de 1 minuto | `quickstart.md`, `LoginPage.test.jsx` |
| SC-004 sesión sobrevive a recargas | `auth-sesion.test.js`, `Sesion.test.jsx` |
| SC-005 logout invalida la sesión | `auth.test.js`, `auth-sesion.test.js` |
| SC-006 0 % de contraseñas en claro | `auth-password.test.js`, `auth-seguridad.test.js` |
| SC-007 usuarios demo acceden | `auth-demo.test.js` |
| SC-008 menú coincide con la matriz | `MenuRol.test.jsx`, `contracts/roles.md` |
| SC-009 0 % identidad por cabecera/URL | `auth-roles.test.js` y búsqueda global de T048 |
| SC-010 arranque y validación rápida | `README.md`, `quickstart.md`, `verification.md` |

## 5. Comprobaciones manuales del quickstart

Se validaron login, recarga de sesión, logout, credenciales incorrectas, 401 sin sesión, 403 por rol,
cada rol con sus módulos y la cocina limitada a la partida de la sesión. La guía reproducible está en
[`quickstart.md`](./quickstart.md).
