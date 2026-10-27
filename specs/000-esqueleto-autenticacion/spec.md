# Feature Specification: Esqueleto del proyecto y autenticación por roles

**Feature Branch**: `feature/000-esqueleto-autenticacion`

**Created**: 2026-10-27

**Status**: Draft

**Input**: Historia 00: documentar el esqueleto ya implementado y añadir login real con sesión persistente, logout y control de acceso por roles.

## Contexto y alcance

Esta historia documenta la **base compartida ya implementada** y añade la **autenticación real** que
las demás historias asumen:

- Monorepositorio `backend/` + `frontend/` y `docker-compose.yml`.
- Backend con Express, SQLite, migraciones versionadas y datos de ejemplo.
- Frontend con React, Chakra UI y Vite.
- Canal SSE y cliente REST.
- Pruebas con Vitest, Supertest y React Testing Library.
- README, guiones de verificación y arranque reproducible con Docker.

Sobre esa base se incorpora un login real con usuarios, contraseñas no reversibles, sesión
persistente, logout y permisos por rol. La identidad deja de simularse con cabeceras, variables de
entorno o parámetros de URL.

**Fuera de alcance de esta historia**:

- Reutilización de mesas cerradas y tratamiento de pedidos pendientes al cerrar una cuenta
  (corresponde a la historia 006).
- Corrección de la fecha y de los errores del dashboard (historia 007).
- Gestión completa de la carta (historia 008); aquí solo se protege su acceso por rol.
- Registro público, recuperación de contraseña, doble factor, OAuth/SSO e integración con
  proveedores externos.
- Política de complejidad, rotación y autoservicio de contraseñas. Las cuentas iniciales las crea el
  seed; la contraseña demo `demo1234` es exclusivamente local y no representa una política de
  producción.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Base compartida del proyecto (Priority: P1)

El equipo dispone de una base única, reproducible y documentada sobre la que se implementan las
ocho historias funcionales: estructura de backend y frontend, arranque con contenedores, base de
datos con migraciones y datos de ejemplo, API, interfaz, tiempo real y pruebas.

**Why this priority**: Sin una base común no se pueden desarrollar ni validar las historias
funcionales de forma consistente.

**Independent Test**: Desde un clon limpio, levantar el proyecto con Docker, cargar el seed y
comprobar que el frontend, la API y las suites de pruebas arrancan correctamente.

**Acceptance Scenarios**:

1. **Given** un clon limpio del repositorio, **When** se ejecuta el arranque documentado,
   **Then** frontend y backend quedan disponibles y la base de datos se crea con sus migraciones.
2. **Given** una base recién creada, **When** se ejecuta el seed, **Then** existen partidas,
   usuarios, mesas, platos y pedidos de ejemplo suficientes para demostrar las historias.
3. **Given** el proyecto arrancado, **When** se ejecutan las suites de pruebas, **Then** backend y
   frontend terminan en verde.
4. **Given** el repositorio, **When** se revisa su documentación, **Then** el equipo encuentra el
   arranque, la configuración, la verificación y el mapa de historias sin depender de conocimiento
   no escrito.
5. **Given** el repositorio y sus datos de ejemplo, **When** se revisan, **Then** no contienen
   secretos reales ni credenciales de producción.

---

### User Story 2 - Iniciar sesión, mantener la sesión y cerrar sesión (Priority: P1)

Una persona del restaurante accede con su usuario y contraseña. La aplicación mantiene la sesión
mientras trabaja, incluso al recargar la página, y permite cerrar sesión de forma explícita. Sin
sesión válida no se puede acceder a ninguna pantalla ni operación protegida.

**Why this priority**: Es la puerta de entrada a todas las funciones y la base para que cada rol
opere únicamente sobre lo que le corresponde.

**Independent Test**: Iniciar sesión con un usuario de demostración, recargar la página y comprobar
que la sesión continúa; cerrar sesión y comprobar que se vuelve al acceso y que las rutas protegidas
quedan cerradas.

**Acceptance Scenarios**:

1. **Given** un usuario válido, **When** introduce sus credenciales correctas, **Then** accede a la
   pantalla inicial de su rol.
2. **Given** credenciales incorrectas o un usuario inexistente, **When** intenta acceder, **Then**
   recibe un mensaje genérico de credenciales incorrectas y no se crea sesión.
3. **Given** una sesión válida, **When** recarga la página o vuelve más tarde dentro del plazo de
   sesión, **Then** sigue autenticado.
4. **Given** una sesión válida, **When** pulsa «Cerrar sesión», **Then** la sesión se invalida y
   vuelve a la pantalla de acceso.
5. **Given** una petición sin sesión válida, **When** intenta acceder a una ruta o API protegida,
   **Then** recibe `401` o es redirigido al acceso, sin mostrar datos.
6. **Given** una sesión caducada, **When** realiza una operación protegida, **Then** se le pide
   volver a iniciar sesión.
7. **Given** una configuración de duración de sesión, **When** transcurre el plazo sin actividad,
   **Then** la sesión deja de ser válida sin intervención manual.

---

### User Story 3 - Acceder solo a lo que permite el rol (Priority: P1)

Cada persona accede únicamente a los módulos y operaciones de su rol. Un camarero no puede entrar al
dashboard, un cocinero no puede entrar a las pantallas de sala y cada cocinero trabaja solo con la
partida que tiene asignada. El encargado accede al dashboard y el administrador a la gestión de la
carta.

**Why this priority**: Evita que un perfil realice operaciones fuera de su responsabilidad y protege
la coherencia de los datos operativos.

**Independent Test**: Iniciar sesión con cada rol, comprobar su pantalla inicial y verificar que las
rutas y APIs de los demás roles devuelven acceso denegado.

**Acceptance Scenarios**:

1. **Given** un camarero autenticado, **When** intenta abrir el dashboard, **Then** no ve la entrada
   en el menú y recibe acceso denegado si entra por URL directa.
2. **Given** un cocinero autenticado, **When** intenta abrir una pantalla de sala, **Then** no ve la
   entrada en el menú y recibe acceso denegado si entra por URL directa.
3. **Given** un encargado autenticado, **When** entra en el dashboard, **Then** accede correctamente.
4. **Given** un administrador autenticado, **When** entra en la gestión de carta, **Then** accede
   correctamente y el resto de roles quedan excluidos.
5. **Given** un cocinero autenticado, **When** intenta marcar un plato de otra partida, **Then** la
   operación se rechaza con `403`.
6. **Given** un rol autenticado, **When** llama directamente a una API de otro rol, **Then** recibe
   `403` sin ejecutar la operación.
7. **Given** una petición de escritura desde un origen no permitido, **When** llega al backend,
   **Then** se rechaza sin ejecutar la operación.
8. **Given** una sesión con el rol adecuado, **When** usa los flujos existentes de las historias
   001–004, **Then** siguen funcionando con la identidad de la sesión.

---

### User Story 4 - Credenciales de demostración para el equipo (Priority: P2)

El equipo dispone de usuarios de demostración para cada rol, con credenciales documentadas y
marcadas como no productivas. Esto permite validar el login y los permisos desde el primer arranque
sin crear cuentas manualmente.

**Why this priority**: Facilita la validación de la historia y de las demás historias, pero no es
parte de la seguridad de producción.

**Independent Test**: Con una base recién sembrada, iniciar sesión con un usuario de cada rol usando
las credenciales documentadas.

**Acceptance Scenarios**:

1. **Given** una base recién sembrada, **When** se consultan las credenciales de demostración,
   **Then** existe al menos un usuario por rol y un cocinero por partida.
2. **Given** las credenciales de demostración, **When** se usan en el entorno local, **Then** el
   acceso funciona y el rol mostrado coincide con el usuario.
3. **Given** el repositorio, **When** se revisan las credenciales, **Then** están identificadas como
   demostración y no son credenciales reales de producción.

---

### Edge Cases

- Usuario inexistente y contraseña incorrecta: mismo mensaje genérico, sin revelar si el usuario
  existe.
- Campos vacíos o incompletos en el acceso: no se envía la petición y se indica el error.
- Sesión caducada durante una operación: se cierra la vista protegida y se pide volver a acceder.
- Cierre de sesión con una sesión ya caducada: se trata como cierre correcto y se vuelve al acceso.
- Acceso directo por URL a un módulo no permitido: se muestra acceso denegado sin cargar datos.
- Llamada directa a la API sin sesión: `401`; con sesión de otro rol: `403`.
- Cocinero sin partida asignada: puede autenticarse, pero la vista de cocina indica que no tiene
  partida y no permite marcar platos.
- Administrador o encargado sin partida: no se les asigna una partida de cocina por defecto.
- Varias sesiones del mismo usuario: se permiten; cerrar una no invalida las demás.
- Reinicio del servidor: las sesiones válidas persisten hasta su caducidad o cierre explícito.
- Credenciales de demostración: no deben reutilizarse en producción.
- Acceso a la gestión de carta: se protege por rol; la funcionalidad completa de carta pertenece a
  la historia 008.
- Origen no permitido: una petición de escritura desde un origen no autorizado se rechaza sin
  ejecutar la operación.
- Configuración de sesión: si cambia el plazo por entorno, la caducidad se comporta según la nueva
  configuración sin desplegar secretos en el código.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El proyecto MUST disponer de la estructura de monorepositorio con backend, frontend,
  pruebas y configuración de arranque conjunto.
- **FR-002**: El backend MUST exponer la API y crear la base de datos aplicando todas las
  migraciones versionadas.
- **FR-003**: El seed MUST cargar partidas, usuarios, mesas, platos, pedidos y cuentas de ejemplo
  suficientes para el desarrollo y la demostración.
- **FR-004**: El frontend MUST ofrecer una aplicación web con Chakra UI y las rutas de los módulos
  del restaurante.
- **FR-005**: El sistema MUST disponer de un canal de actualización en tiempo real para cocina y
  sala.
- **FR-006**: El proyecto MUST incluir pruebas automatizadas de backend y frontend y documentación
  de arranque y verificación.
- **FR-007**: Un usuario MUST poder iniciar sesión con un identificador de usuario y una contraseña.
- **FR-008**: Las contraseñas MUST almacenarse de forma no reversible y MUST NOT mostrarse,
  registrarse ni devolverse en ninguna respuesta.
- **FR-009**: Un intento de acceso fallido MUST devolver un mensaje genérico y MUST NOT crear una
  sesión.
- **FR-010**: Tras un acceso correcto, el sistema MUST crear una sesión asociada al usuario y a su
  rol.
- **FR-011**: La sesión MUST mantenerse al recargar la página y durante el plazo de validez
  configurado.
- **FR-012**: El usuario MUST poder cerrar sesión; el cierre MUST invalidar la sesión actual y
  devolver a la pantalla de acceso.
- **FR-013**: Una sesión caducada MUST dejar de permitir operaciones protegidas y MUST solicitar un
  nuevo acceso.
- **FR-014**: El sistema MUST reconocer los roles `camarero`, `cocinero`, `encargado` y
  `administrador`.
- **FR-015**: Cada cocinero MUST tener una única partida asignada, o ninguna; no podrá tener varias.
- **FR-016**: La identidad y el rol MUST derivarse de la sesión; no MUST aceptarse cabeceras,
  variables de entorno ni parámetros de URL como identidad.
- **FR-017**: Sin sesión válida, toda ruta y API protegida MUST responder `401` o redirigir al
  acceso, sin mostrar datos.
- **FR-018**: Con sesión válida pero rol no autorizado, toda ruta y API MUST responder `403` o
  mostrar acceso denegado, sin ejecutar la operación.
- **FR-019**: El menú y las rutas del frontend MUST mostrar únicamente los módulos permitidos al rol
  de la sesión.
- **FR-020**: El camarero MUST poder acceder a las pantallas de sala y cuentas, y MUST NOT acceder
  al dashboard.
- **FR-021**: El cocinero MUST poder acceder a la pantalla de cocina, limitada a su partida, y MUST
  NOT acceder a las pantallas de sala.
- **FR-022**: El encargado MUST poder acceder al dashboard.
- **FR-023**: El administrador MUST poder acceder a la gestión de carta; la funcionalidad completa
  de gestión pertenece a la historia 008.
- **FR-024**: Los endpoints de sala, cocina, dashboard y administración MUST exigir el rol
  correspondiente en el backend, no solo en la interfaz.
- **FR-025**: Los canales SSE MUST exigir sesión y rol; no MUST permitir identificarse mediante
  parámetros de URL.
- **FR-026**: El seed MUST incluir usuarios de demostración para todos los roles, con credenciales
  documentadas y marcadas como no productivas.
- **FR-027**: El repositorio MUST NOT contener secretos reales, credenciales de producción ni
  contraseñas en claro.
- **FR-028**: La configuración de sesión y seguridad MUST poder ajustarse por entorno sin incluir
  valores secretos en el código.
- **FR-029**: Las peticiones de escritura MUST aceptar solo orígenes permitidos por la configuración
  del restaurante.
- **FR-030**: La aplicación MUST conservar el comportamiento funcional de las historias 001–008 una
  vez sustituida la identidad simulada por la sesión real.

### Key Entities *(include if feature involves data)*

- **Usuario**: persona que accede al sistema; tiene identificador, nombre, rol y, si es cocinero,
  una partida asignada.
- **Credencial**: contraseña asociada al usuario, almacenada de forma no reversible y nunca expuesta.
- **Sesión**: acceso autenticado de un usuario, con rol, momento de creación, caducidad y estado de
  validez.
- **Rol**: perfil de permisos; valores fijos: camarero, cocinero, encargado y administrador.
- **Partida**: entrantes, principales o postres; cada cocinero tiene como máximo una.
- **Permiso de módulo**: relación entre rol y módulos o APIs a los que puede acceder.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100 % de las rutas y APIs protegidas rechazan el acceso sin sesión con `401` o
  redirección al acceso.
- **SC-002**: El 100 % de los accesos con rol no autorizado se rechazan con `403` o acceso denegado
  y no ejecutan la operación.
- **SC-003**: Un usuario completa el acceso con credenciales correctas en menos de 1 minuto.
- **SC-004**: La sesión sobrevive al 100 % de las recargas de página dentro de su plazo de validez.
- **SC-005**: El 100 % de los cierres de sesión invalidan la sesión actual y devuelven al acceso.
- **SC-006**: El 0 % de las contraseñas se almacena, registra o devuelve en claro.
- **SC-007**: El 100 % de los usuarios de demostración puede acceder con las credenciales
  documentadas y ve el rol correcto.
- **SC-008**: El 100 % de los módulos visibles coincide con la matriz de permisos del rol.
- **SC-009**: El 0 % de las peticiones protegidas obtiene identidad a partir de cabeceras, variables
  de entorno o parámetros de URL.
- **SC-010**: El equipo puede arrancar el proyecto, sembrar los datos y validar el login en menos de
  5 minutos siguiendo el quickstart.

## Assumptions

- El esqueleto descrito en la historia ya está implementado; esta historia lo documenta y lo toma
  como base para añadir autenticación.
- La autenticación es por sesión de servidor; no se usan OAuth, SSO ni proveedores externos.
- Los usuarios son creados previamente por el seed o por administración; no hay registro público ni
  recuperación de contraseña en esta versión.
- La sesión tiene un plazo de validez configurable; por defecto se mantiene durante una jornada de
  trabajo y expira tras 12 horas de inactividad.
- Se permiten varias sesiones del mismo usuario; cerrar una no invalida las demás.
- Los roles son fijos y no se crean roles nuevos desde la aplicación.
- Cada cocinero tiene como máximo una partida; un cocinero sin partida puede autenticarse pero no
  operar en cocina.
- La matriz de acceso es: camarero → sala y cuentas; cocinero → cocina de su partida; encargado →
  dashboard; administrador → gestión de carta. El acceso a la carta completa depende de la historia
  008.
- Las credenciales de demostración se documentan y se consideran datos de ejemplo; no son secretos
  de producción.
- La reutilización de mesas cerradas, el tratamiento de pedidos pendientes al cerrar y la corrección
  del dashboard se tratan en las historias 006 y 007, no en esta.
- Se mantiene el stack y las convenciones de la constitución: React + Chakra UI, ExpressJS, Docker,
  español de España y euro.
