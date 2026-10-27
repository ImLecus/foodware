# Fase 1 — Modelo de datos: esqueleto y autenticación

## Entidades

### Usuario

- **Descripción**: persona que accede al sistema.
- **Campos**:
  - `id` (texto, PK): identificador usado para iniciar sesión.
  - `nombre` (texto): nombre visible.
  - `rol` (texto): `camarero` | `cocinero` | `encargado` | `administrador`.
  - `partida_codigo` (texto, nullable, FK a `partidas`): solo para cocineros; como máximo una.
  - `password_hash` (texto): hash `scrypt` con salt; nunca se expone.
- **Reglas**:
  - Un camarero, encargado o administrador no tiene partida.
  - Un cocinero puede no tener partida; en ese caso no opera sobre platos.
  - `id` es único y estable.
  - El rol no se puede cambiar desde el cliente.

### Credencial

- **Descripción**: secreto asociado al usuario para autenticarse.
- **Campos**: forma parte de `usuarios.password_hash`.
- **Reglas**:
  - Se almacena como hash `scrypt$N$r$p$salt$hash`.
  - Nunca se devuelve, registra en claro ni se incluye en la documentación de API.
  - La contraseña demo se documenta expresamente como no productiva.

### Sesión

- **Descripción**: acceso autenticado de un usuario.
- **Campos**:
  - `token_hash` (texto, PK): SHA-256 del token enviado en la cookie.
  - `usuario_id` (texto, FK a `usuarios`, `ON DELETE CASCADE`).
  - `creada_en` (texto UTC): momento de creación.
  - `ultima_actividad` (texto UTC): última petición autenticada.
  - `expira_en` (texto UTC): `ultima_actividad + TTL`.
- **Reglas**:
  - El token en claro solo existe en la cookie del navegador; en la base se guarda su hash.
  - Una sesión es válida mientras `expira_en > ahora`.
  - Se renueva `ultima_actividad`/`expira_en` al usar la sesión.
  - Logout elimina la fila de la sesión actual.
  - Se permiten varias sesiones por usuario.
  - Al caducar, la fila puede eliminarse de forma perezosa.

### Rol y permiso de módulo

- **Descripción**: perfil fijo y módulos/APIs permitidos.
- **Roles**: `camarero`, `cocinero`, `encargado`, `administrador`.
- **Matriz**: detallada en [contracts/roles.md](./contracts/roles.md).
- **Reglas**:
  - El rol se obtiene del usuario de la sesión, nunca del cliente.
  - Los guards del backend son la fuente de verdad; el frontend solo oculta rutas y menús.
  - Un cocinero solo opera sobre su `partida_codigo`.

### Partida

- **Descripción**: entrantes, principales o postres.
- **Campos**: `codigo`, `nombre`, `orden`.
- **Reglas**: conjunto fijo de tres valores; un cocinero tiene como máximo una.

## Cambios de persistencia

### Migración `006_auth.sql`

1. Añadir a `usuarios`:
   - `password_hash TEXT` (nullable para permitir la migración de usuarios existentes).
2. Crear `sesiones`:
   ```sql
   CREATE TABLE IF NOT EXISTS sesiones (
     token_hash TEXT PRIMARY KEY,
     usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
     creada_en TEXT NOT NULL DEFAULT (datetime('now')),
     ultima_actividad TEXT NOT NULL DEFAULT (datetime('now')),
     expira_en TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS sesiones_por_usuario ON sesiones(usuario_id);
   CREATE INDEX IF NOT EXISTS sesiones_por_expiracion ON sesiones(expira_en);
   ```
3. El seed debe rellenar `password_hash` de los usuarios demo. Los usuarios existentes sin hash no
   podrán iniciar sesión hasta que se les asigne una contraseña; el seed de demostración los
   actualiza.

### Configuración

- `SESSION_TTL_MINUTES` (por defecto `720` = 12 h).
- `SESSION_COOKIE_NAME` (por defecto `foodware_session`).
- `SESSION_COOKIE_SECURE` (por defecto `false` en local; `true` en producción).
- `CORS_ORIGIN` (origen permitido del frontend).
- No se almacenan secretos en el repositorio; `.env.example` solo contiene valores no sensibles.

## Transiciones de sesión

| Estado origen | Acción | Estado destino | Efecto |
|---|---|---|---|
| Sin sesión | Credenciales correctas | Sesión activa | Se crea token/cookie y fila `sesiones` |
| Sin sesión | Credenciales incorrectas | Sin sesión | Error genérico `401`; no se crea fila |
| Sesión activa | Petición autenticada | Sesión activa | Se renueva actividad/expiración |
| Sesión activa | Logout | Sin sesión | Se elimina la fila y se borra la cookie |
| Sesión activa | Pasa el TTL sin actividad | Sesión caducada | `401`; la fila puede limpiarse |
| Sesión de otro rol | Acceso a módulo no permitido | Sesión activa | `403`; no se ejecuta la operación |

## Validaciones

- **V-001**: `usuario` y `password` son obligatorios en el login.
- **V-002**: usuario inexistente y contraseña incorrecta producen el mismo error genérico.
- **V-003**: una sesión solo es válida si su token hasheado existe y no ha expirado.
- **V-004**: el rol del usuario debe pertenecer al conjunto fijo.
- **V-005**: un cocinero no puede operar sobre una línea de otra partida.
- **V-006**: ninguna respuesta incluye `password_hash`, tokens de sesión ni datos de otra sesión.
- **V-007**: el frontend no puede elevar permisos cambiando el menú o la URL; el backend vuelve a
  validar.
- **V-008**: los usuarios demo documentados son los únicos con contraseña conocida y se marcan como
  no productivos.

## Índices y rendimiento

- `sesiones(token_hash)` es la PK y se usa en cada petición autenticada.
- `sesiones(usuario_id)` permite revocar todas las sesiones de un usuario si se necesita.
- `sesiones(expira_en)` permite limpiar sesiones caducadas.
- El login hace una búsqueda por `usuarios.id`; el coste de `scrypt` es el dominante y es aceptable
  para la escala del restaurante.

## Notas de migración de las pruebas

- Los tests actuales que usan `X-Camarero-Id` o `x-usuario-id` deben pasar a un helper que cree una
  sesión y devuelva la cookie.
- Las pruebas de SSE deben abrir el canal con la cookie de sesión y el rol adecuado.
- Las pruebas de cocina deben crear una sesión de cocinero con una partida concreta, no usar
  `?cocinero=`.
- Las pruebas de frontend deben montar el contexto de autenticación con un usuario/rol simulado
  **solo en el cliente de pruebas**, nunca en producción.
