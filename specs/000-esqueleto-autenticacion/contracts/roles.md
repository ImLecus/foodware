# Contrato de roles y permisos

## Principios

- La identidad y el rol se obtienen **solo de la sesión**.
- El backend es la fuente de verdad; el frontend oculta rutas y menús, pero no sustituye la
  autorización del servidor.
- Sin sesión: `401` o redirección al acceso.
- Con sesión y rol incorrecto: `403` o pantalla de acceso denegado.
- No se aceptan `X-Camarero-Id`, `x-usuario-id`, `VITE_CAMARERO_ID`, `VITE_USUARIO_ID`, `VITE_ROL`
  ni `?cocinero=` como identidad.

## Matriz de acceso

| Rol | Páginas | APIs | Restricciones |
|---|---|---|---|
| Camarero | `/sala`, `/sala/estado`, `/sala/platos`, `/cuentas` | `/api/mesas`, `/api/pedidos`, `/api/sala` | No dashboard, no cocina, no administración |
| Cocinero | `/cocina` | `/api/cocineros/:id` (propio), `/api/partidas/:id/pedidos-pendientes`, `PUT /api/pedidos/:pedidoId/lineas/:lineaId/estado`, `/api/partidas/:id/eventos` | Solo su partida; no sala, no dashboard, no administración |
| Encargado | `/dashboard` | `/api/reports/*` | No cocina, no sala operativa, no administración |
| Administrador | `/admin` | `/api/admin/*` cuando exista la historia 008 | No cocina, no sala operativa, no dashboard |
| Cualquiera autenticado | `/`, menú propio, logout | `/api/auth/me`, `/api/auth/logout`, `/api/eventos` | El inicio redirige a la página de su rol |
| Sin sesión | `/login` | `/api/auth/login`, `/api/health` | Cualquier otra ruta/API: `401` o redirección |

## Matriz de APIs existentes

| Recurso | Rol exigido |
|---|---|
| `GET /api/mesas`, `POST /api/mesas/:id/abrir` | camarero |
| `GET/POST/PATCH/DELETE /api/pedidos/*` | camarero |
| `GET /api/sala/*`, `/api/mesas/:id/estado-platos`, `/api/mesas/:id/eventos` | camarero |
| `GET /api/cocineros/:id` | cocinero autenticado (solo su propio id) |
| `GET /api/partidas/:id/pedidos-pendientes`, `/api/partidas/:id/eventos` | cocinero de esa partida |
| `PUT /api/pedidos/:pedidoId/lineas/:lineaId/estado` | cocinero; la línea debe ser de su partida |
| `GET /api/reports/*` | encargado |
| `/api/admin/*` | administrador (historia 008) |
| `/api/auth/login` | público |
| `/api/auth/me`, `/api/auth/logout` | cualquier sesión válida |
| `/api/health` | público |

## Comportamiento en la interfaz

- La cabecera muestra el nombre y el rol del usuario de la sesión.
- El menú solo incluye los módulos permitidos por la matriz.
- El inicio `/` redirige a la página inicial del rol.
- Una URL directa a un módulo no permitido muestra acceso denegado o redirige al inicio del rol.
- El botón «Cerrar sesión» está siempre visible en la cabecera autenticada.
- La pantalla de login no muestra el menú ni datos de la aplicación.
- Un cocinero sin partida ve el estado «sin partida» en cocina y no puede marcar líneas.
- El administrador accede a la entrada de carta; la gestión completa se implementa en la historia
  008.

## Contrato de errores

- `401` sin sesión o con sesión caducada: mensaje en español y redirección al acceso en la UI.
- `401` en login: «Usuario o contraseña incorrectos», sin distinguir el motivo.
- `403` con rol incorrecto: «No tienes permisos para acceder a esta sección».
- Los cuerpos de error mantienen `{ codigo, mensaje }`.
