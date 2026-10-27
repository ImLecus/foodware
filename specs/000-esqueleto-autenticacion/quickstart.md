# Quickstart — Esqueleto y autenticación por roles (000)

Guía para validar el esqueleto existente y el login/control de acceso desde la interfaz, sin leer
código.

## Requisitos previos

- Docker y Docker Compose.
- Puertos libres para frontend y backend.
- Una base de datos sembrada con los usuarios de demostración.

## Puesta en marcha

```bash
docker compose up --build
docker compose exec backend npm run seed
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:3000/api/health>

## Credenciales de demostración

Todas las cuentas de ejemplo usan la contraseña **`demo1234`**. Son credenciales exclusivamente
locales, no de producción.

| Usuario | Rol | Partida |
|---|---|---|
| `camarero-1` | camarero | — |
| `camarero-2` | camarero | — |
| `cocinero-entrantes` | cocinero | entrantes |
| `cocinero-principales` | cocinero | principales |
| `cocinero-postres` | cocinero | postres |
| `cocinero-sin-partida` | cocinero | ninguna |
| `encargado-1` | encargado | — |
| `admin-1` | administrador | — |

## Escenarios de validación

### 1. Login y sesión persistente

1. Abre el frontend y entra con `camarero-1` / `demo1234`.
2. **Esperado**: accede a la pantalla de sala del camarero y aparece su nombre/rol.
3. Recarga la página.
4. **Esperado**: sigue autenticado; no vuelve a pedir credenciales.
5. Pulsa «Cerrar sesión».
6. **Esperado**: vuelve al acceso y una ruta protegida ya no muestra datos.

### 2. Credenciales incorrectas

1. Intenta entrar con `camarero-1` y una contraseña incorrecta.
2. **Esperado**: mensaje genérico de credenciales incorrectas; no se crea sesión.
3. Repite con un usuario inexistente.
4. **Esperado**: el mismo mensaje, sin revelar si el usuario existe.

### 3. Camarero: solo sala y cuentas

1. Entra con `camarero-1`.
2. **Esperado**: ve Sala y Cuentas; no ve Dashboard.
3. Entra directamente en `/dashboard`.
4. **Esperado**: acceso denegado, sin cargar datos del dashboard.
5. Llama a la API del dashboard con la sesión del camarero.
6. **Esperado**: `403`.

### 4. Cocinero: solo cocina de su partida

1. Entra con `cocinero-entrantes`.
2. **Esperado**: accede a Cocina y solo puede marcar líneas de entrantes.
3. Intenta abrir `/sala` directamente.
4. **Esperado**: acceso denegado.
5. Intenta marcar una línea de principales.
6. **Esperado**: la línea no ofrece acción y la API responde `403`.
7. Repite el acceso con `cocinero-principales` y comprueba que los botones cambian a sus platos.
8. Entra con `cocinero-sin-partida`.
9. **Esperado**: puede autenticarse, pero la cocina indica que no tiene partida y no permite marcar.

### 5. Encargado y administrador

1. Entra con `encargado-1`.
2. **Esperado**: accede al Dashboard y no a Cocina ni a Sala por URL directa.
3. Entra con `admin-1`.
4. **Esperado**: accede a la gestión de carta; las APIs de dashboard, sala y cocina responden `403`.

### 6. Sin sesión

1. Cierra sesión o abre una ventana privada.
2. Intenta abrir `/sala`, `/cocina` o `/dashboard`.
3. **Esperado**: redirección al acceso o acceso denegado.
4. Llama directamente a una API protegida sin sesión.
5. **Esperado**: `401`.

### 7. Sesión caducada

1. Arranca el backend con una duración de sesión corta, por ejemplo `SESSION_TTL_MINUTES=1`.
2. Inicia sesión y espera a que pase el plazo sin actividad.
3. Recarga o intenta una operación protegida.
4. **Esperado**: se solicita volver a iniciar sesión y no se muestran datos protegidos.

## Comprobación rápida por API

Con el backend arrancado:

```bash
# Login: guarda la cookie de sesión
curl -i -c /tmp/foodware.cookies \
  -H 'Content-Type: application/json' \
  -d '{"usuario":"camarero-1","password":"demo1234"}' \
  http://localhost:3000/api/auth/login

# Usuario y rol de la sesión
curl -s -b /tmp/foodware.cookies http://localhost:3000/api/auth/me

# El camarero no puede ver el dashboard
curl -i -b /tmp/foodware.cookies http://localhost:3000/api/reports/daily

# Logout
curl -i -b /tmp/foodware.cookies -X POST http://localhost:3000/api/auth/logout

# Tras el logout, la sesión ya no vale
curl -i -b /tmp/foodware.cookies http://localhost:3000/api/auth/me
```

Resultados esperados: login correcto, `me` devuelve el rol, dashboard `403`, logout correcto y
`me` posterior `401`. La sesión se transporta en una cookie `HttpOnly`; no se usa ninguna cabecera
de identidad ni parámetro `?cocinero=`.

La matriz completa de páginas, APIs y permisos está en
[`contracts/roles.md`](./contracts/roles.md).

## Qué queda fuera de esta historia

- Las historias 001–008 siguen funcionando, pero la identidad ya no se toma de
  `X-Camarero-Id`, `x-usuario-id`, `VITE_ROL` ni `?cocinero=`.
- La reutilización de mesas cerradas y el tratamiento de pedidos pendientes al cerrar se validan en
  la historia 006.
- La fecha y los errores del dashboard se validan en la historia 007.
- La gestión completa de la carta se valida en la historia 008.
