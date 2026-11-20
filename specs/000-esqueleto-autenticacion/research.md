# Fase 0 — Investigación: esqueleto y autenticación por roles

## R1. Mecanismo de autenticación

- **Decisión**: sesión de servidor con token opaco aleatorio, almacenado como hash en SQLite y
  enviado al navegador en una cookie `HttpOnly`.
- **Razón**: permite revocar sesiones de inmediato al hacer logout, caducar por inactividad y
  mantener la identidad en el servidor sin exponer datos del usuario en el cliente. Es más simple
  que introducir JWT, claves de firma y lógica de revocación.
- **Alternativas consideradas**: JWT (revocación y logout más complejos); OAuth/SSO (fuera del
  alcance y del stack); identidad simulada por cabeceras (incumple la historia 000).

## R2. Hash de contraseñas

- **Decisión**: usar `crypto.scrypt` nativo de Node con salt aleatorio y comparación en tiempo
  constante. Formato de almacenamiento versionado, por ejemplo
  `scrypt$N$r$p$salt$hash`.
- **Razón**: evita añadir una dependencia externa, cumple el principio de simplicidad y ofrece un
  algoritmo de derivación de contraseñas adecuado para la escala del restaurante.
- **Alternativas consideradas**: bcrypt/argon2 (buenas opciones, pero añaden dependencia y
  configuración); SHA-256 simple (insuficiente para contraseñas).

## R3. Transporte de la sesión, CORS y SSE

- **Decisión**: cookie de sesión `HttpOnly`, `SameSite=Lax`, `Secure` en producción y `Path=/`.
  El frontend envía `credentials: 'include'` en `fetch` y configura `withCredentials` en
  `EventSource` cuando el backend está en otro origen. El backend habilita CORS con credenciales
  solo para el origen configurado.
- **Razón**: la cookie no es legible por JavaScript y funciona tanto en desarrollo como en un
  despliegue same-site. El proyecto ya usa frontend y backend en el mismo host local.
- **Alternativas consideradas**: token en `localStorage` (más expuesto a XSS); cabecera Authorization
  (requiere gestionar el token en el cliente y complica SSE); sesiones en memoria (se pierden al
  reiniciar).

## R4. Duración y ciclo de vida de la sesión

- **Decisión**: duración por defecto de 12 horas de inactividad, configurable por entorno. Cada
  petición autenticada renueva la actividad; logout revoca solo la sesión actual. Se permiten varias
  sesiones del mismo usuario.
- **Razón**: cubre una jornada de trabajo, limita el riesgo de una sesión abandonada y permite
  trabajar desde varios dispositivos.
- **Alternativas consideradas**: sesión indefinida (riesgo de seguridad); sesión de una sola petición
  (peor experiencia); invalidar todas las sesiones al cerrar una (no requerido).

## R5. Matriz de roles y permisos

- **Decisión**: roles fijos `camarero`, `cocinero`, `encargado` y `administrador`, con la matriz de
  [contracts/roles.md](./contracts/roles.md). Un cocinero tiene como máximo una partida.
- **Razón**: refleja las responsabilidades del restaurante y evita que un perfil invada el trabajo de
  otro. La autorización se aplica en backend y frontend.
- **Alternativas consideradas**: roles configurables (fuera de alcance); un único rol con permisos
  ad hoc (difícil de auditar); confiar solo en el menú del frontend (inseguro).

## R6. Sustitución de la identidad simulada

- **Decisión**: eliminar `X-Camarero-Id`, `x-usuario-id`, `VITE_CAMARERO_ID`, `VITE_USUARIO_ID`,
  `VITE_ROL` y `?cocinero=` como fuentes de identidad. Toda identidad y rol se obtienen de la sesión.
- **Razón**: la historia exige login real y que un usuario no pueda elegir suplantar a otro rol
  cambiando una cabecera o una URL.
- **Impacto**: hay que adaptar los helpers de pruebas, los clientes REST/SSE y las vistas de cocina,
  sala, dashboard y administración.

## R7. Migración y datos de demostración

- **Decisión**: migración `006_auth.sql` que añade `usuarios.password_hash` y crea `sesiones`. El
  seed calcula el hash de la contraseña demo `demo1234` y actualiza los usuarios existentes.
- **Razón**: permite migrar bases ya creadas sin perder datos y deja credenciales reproducibles para
  el equipo. La contraseña demo no es un secreto de producción.
- **Alternativas consideradas**: recrear la base siempre (pierde datos locales); guardar contraseñas
  en claro (inaceptable); usuarios sin contraseña (no se puede validar el login).

## R8. Errores y respuestas

- **Decisión**: mantener el contrato de error `{ codigo, mensaje }`; credenciales incorrectas y
  usuario inexistente devuelven el mismo `401` genérico; rol no autorizado devuelve `403`; sin sesión
  `401`. El frontend distingue error de red, sesión inválida y permiso denegado.
- **Razón**: evita enumerar usuarios y permite mensajes claros en español.
- **Alternativas consideradas**: mensajes distintos para usuario/contraseña (filtra información);
  devolver `200` con error lógico (dificulta guards y pruebas).

## R9. Estrategia de pruebas

- **Decisión**: helpers de backend que crean una sesión y devuelven la cookie; pruebas de contrato de
  login/me/logout; pruebas de 401/403 por rol; pruebas de unidad de hash y sesión; pruebas de
  componentes para login, persistencia, logout, menú y acceso denegado.
- **Razón**: la seguridad no puede depender solo de pruebas de UI; hay que verificar backend y
  frontend. Las pruebas existentes se adaptan para autenticarse con cookie en lugar de cabeceras.
- **Alternativas consideradas**: mantener un bypass de test por cabecera (dejaría una puerta trasera
  en producción); probar solo la UI (no verifica autorización real).

## R10. Documentación del esqueleto

- **Decisión**: la historia 000 documenta el esqueleto ya implementado (monorepo, Docker, SQLite,
  migraciones, seed, Express, React/Chakra/Vite, SSE, pruebas y README) y lo trata como base estable.
- **Razón**: el usuario pidió conservar la documentación de lo construido y añadir el login sin
  reescribir la historia.
- **Alternativas consideradas**: dejar el esqueleto solo en el README (menos trazable); crear una
  historia separada solo de documentación (duplicaría el alcance).
