# Plan de Implementación: Esqueleto del proyecto y autenticación por roles

**Rama**: `000-esqueleto-autenticacion` | **Fecha**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la historia 000 en `specs/000-esqueleto-autenticacion/spec.md`.

## Resumen

La historia 000 documenta la base compartida ya implementada y añade la autenticación real que el
resto de historias asume. La solución mantiene el stack existente (React + Chakra UI, ExpressJS,
SQLite, SSE y Docker) y sustituye la identidad simulada por sesiones de servidor con contraseñas
hasheadas, cookies `HttpOnly` y autorización por rol.

La matriz de acceso queda fijada así:

| Rol | Módulos principales | APIs principales |
|---|---|---|
| Camarero | Sala, señales de sala, cuentas | Mesas, pedidos, sala |
| Cocinero | Cocina de su partida | Cocineros, partidas, estado de líneas, SSE de partida |
| Encargado | Dashboard | Informes |
| Administrador | Gestión de carta | Administración de carta (historia 008) |

La historia 000 no implementa la reutilización de mesas cerradas (006), la corrección funcional del
dashboard (007) ni la gestión completa de carta (008); solo protege sus accesos por rol.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022; Node.js 22 en backend; navegador moderno en frontend.

**Dependencias principales**: React 18, Chakra UI, Vite, ExpressJS 4, `better-sqlite3`, SSE y
crypto nativo de Node para hashing y tokens. Sin proveedor de identidad externo.

**Almacenamiento**: SQLite con migraciones SQL versionadas. Se añaden `password_hash` a `usuarios`
y una tabla `sesiones`.

**Autenticación**: sesión de servidor con token opaco aleatorio en cookie `HttpOnly`; hash de
contraseña con `scrypt` y comparación en tiempo constante. La sesión se revoca al hacer logout y
caduca por inactividad.

**Testing**: Vitest, Supertest y React Testing Library. Se añaden helpers para autenticar peticiones
con cookies de sesión y para probar guards de rol.

**Plataforma objetivo**: aplicación web en Docker; frontend y backend servidos en el mismo local.

**Tipo de proyecto**: aplicación web full-stack con monorepositorio.

**Objetivos de rendimiento**: login percibido en menos de 1 s en local; consulta de sesión por índice;
ninguna operación protegida supera el tiempo actual de la API.

**Restricciones**: español de España; sin secretos reales en el repositorio; sin OAuth, registro
público ni recuperación de contraseña en v1; un cocinero tiene como máximo una partida.

**Escala/Ámbito**: un restaurante, 4 roles, decenas de usuarios y ~20 mesas; varias sesiones por
persona permitidas.

## Verificación de la Constitución

| Principio / regla | Comprobación | Estado |
|---|---|---|
| I. Simplicidad | Sesión opaca en SQLite y `scrypt` nativo; sin JWT, OAuth ni servicio externo | Pasa |
| II. Español de España y euro | Login, errores, roles y menús en español; sin cambios de moneda | Pasa |
| III. Cero alcance fantasma | Solo esqueleto documentado + autenticación/guards; 006, 007 y 008 fuera de alcance | Pasa |
| IV. Verificable por no técnica | Quickstart con credenciales demo y escenarios por rol | Pasa |
| V. Datos con respeto | Solo identidad operativa; contraseñas hasheadas; sin secretos reales | Pasa |
| VI. Conventional Commits | Aplicable en implementación | Pasa |
| VII. Desarrollo en equipo | Arranque Docker reproducible y credenciales demo documentadas | Pasa |
| Tecnología obligatoria | React + Chakra UI; ExpressJS sobre Node.js | Pasa |
| Contenedores | Sin cambios de infraestructura; mismas imágenes y compose | Pasa |
| Calidad y pruebas | Plan de unitarias, contrato, integración y componentes | Pasa |

**Resultado**: sin violaciones; no se añade complejidad que no esté justificada por el requisito de
autenticación.

## Estructura del Proyecto

### Documentación de esta historia

```text
specs/000-esqueleto-autenticacion/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/requirements.md
└── contracts/
    ├── auth-api.yaml
    └── roles.md
```

### Código afectado

```text
backend/
├── migrations/
│   └── 006_auth.sql              # password_hash + sesiones
├── src/
│   ├── auth/
│   │   ├── password.js           # scrypt: hash y verificación
│   │   ├── cookies.js            # leer/escribir cookies HttpOnly
│   │   └── sesiones.js           # crear, buscar, renovar y revocar
│   ├── middleware/
│   │   ├── autenticar.js         # sesión -> req.usuario
│   │   ├── authorize.js          # requireRole reutilizable
│   │   └── origen.js             # rechazo de escrituras desde orígenes no permitidos
│   ├── routes/auth.js            # login, me, logout
│   ├── config.js                 # cookie y TTL por entorno
│   ├── db/seed.js                # credenciales demo
│   └── app.js                    # registro de auth y guards
└── tests/
    ├── helpers/auth.js           # crear sesión/cookie de prueba
    ├── unit/                     # password, sesiones, roles
    ├── contract/                 # auth y 401/403
    └── integration/              # login + flujo completo por rol

frontend/
├── src/
│   ├── auth/
│   │   ├── AuthContext.jsx       # usuario, rol, login/logout
│   │   └── rutas.js              # inicio por rol y matriz de acceso
│   ├── pages/LoginPage.jsx
│   ├── components/RutaProtegida.jsx
│   ├── components/UsuarioMenu.jsx
│   ├── services/api.js           # credentials: include
│   ├── services/realtime.js      # SSE con credenciales
│   ├── App.jsx                   # rutas y menú por rol
│   ├── pages/CocinaPage.jsx      # partida desde sesión, sin ?cocinero=
│   └── ...
└── tests/
    ├── auth/                     # login, sesión, logout, guards
    └── ...
```

**Decisión de estructura**: se mantiene el monorepositorio actual y se añade una capa pequeña de
autenticación, sin tocar la organización por historias ni introducir un servicio de identidad
externo.

## Fases de Implementación

### Fase 0 — Investigación

Resolver las decisiones de autenticación, sesión, cookies, hashing, matriz de roles, datos demo y
migración de las pruebas actuales. Resultado: [research.md](./research.md).

### Fase 1 — Diseño

Definir entidades, migración, contratos y guía de validación:

- [data-model.md](./data-model.md)
- [contracts/auth-api.yaml](./contracts/auth-api.yaml)
- [contracts/roles.md](./contracts/roles.md)
- [quickstart.md](./quickstart.md)

### Fase 2 — Tareas

Después de este plan, `/speckit.tasks` debe generar tareas para:

1. Migración `006_auth.sql` y actualización del seed con credenciales demo.
2. Utilidades de contraseña y sesión.
3. Middleware de autenticación y autorización.
4. Rutas `login`, `me` y `logout`.
5. Protección de rutas existentes y SSE; retirada de cabeceras/query de identidad.
6. Contexto de autenticación y pantalla de login en frontend.
7. Guards de rutas, menú por rol y logout.
8. Adaptación de cocina/sala/dashboard/carta a la sesión.
9. Pruebas backend de contraseña, sesión, 401/403 y roles.
10. Pruebas frontend de login, persistencia, logout, guards y menú.
11. Actualización de quickstart, README y verificación.
12. Comprobación de que las historias 001–008 siguen funcionando con la sesión real.

## Seguimiento de Complejidad

No hay violaciones de la constitución que justificar. La tabla `sesiones` y la capa de autenticación
son la mínima complejidad necesaria para cumplir los requisitos de sesión, logout y autorización por
rol sin introducir un proveedor externo.
