# Investigación (Fase 0): Gestión de la carta

Resuelve las incógnitas del Contexto Técnico y fija las decisiones de diseño para la
funcionalidad. No hay marcadores `NEEDS CLARIFICATION` pendientes: cada punto queda decidido con
su justificación.

## D1. Modelo de disponibilidad: derivada frente a persistida

- **Decisión**: la disponibilidad ofrecida de un plato se **calcula al leer** como
  `plato.activo AND todos sus ingredientes están disponibles`. No se guarda un campo "disponible"
  calculado ni se sincroniza al cambiar el estado de un ingrediente.
- **Razón**: es la regla combinada de FR-012; una sola fuente de verdad evita desincronización y
  garantiza reflejo inmediato (SC-002, FR-007/FR-008). Cumple simplicidad (constitución, I).
- **Alternativas consideradas**: persistir un campo `disponible` actualizado al cambiar ingredientes
  (duplica la verdad y puede quedar obsoleto); tabla de eventos de disponibilidad (innecesaria en v1).

## D2. Catálogo de roles y autorización

- **Decisión**: la gestión de la carta exige rol **`administrador`** mediante middleware en el
  backend; el frontend solo muestra la ruta `/admin/carta` a ese rol. La consulta de la carta
  vigente está disponible para cualquier usuario autenticado (camarero/encargado/administrador).
- **Razón**: la spec restringe la gestión al administrador (FR-001) y reserva la carta a sala para
  el resto; mantener la comprobación en el backend evita exponer datos por ocultación en la UI.
- **Alternativas consideradas**: control solo en el frontend (inseguro, descartado); reutilizar el
  rol `encargado` del dashboard (descartado: la historia 07 y la 08 describen perfiles distintos).
- **Nota de equipo**: la historia 08 habla de "administrador" y la 07 de "encargado"; el catálogo de
  roles (`camarero`, `encargado`, `administrador`) debe confirmarse con la historia de autenticación
  del equipo antes de implementar.

## D3. Diseño de la API

- **Decisión**: endpoints REST protegidos:
  - Gestión (rol `administrador`): `GET /api/admin/platos` (incluye no disponibles),
    `POST /api/admin/platos`, `PATCH /api/admin/platos/:id` (nombre, partida, precio, `activo`),
    `GET /api/admin/ingredientes`, `PATCH /api/admin/ingredientes/:id` (estado).
  - Consulta (cualquier autenticado): `GET /api/carta` devuelve solo los platos ofrecibles,
    agrupados por partida.
- **Razón**: separa la vista de gestión de la carta pública que consume la historia 01, es fácil de
  probar y evita que la tableta de sala reciba platos ocultos.
- **Alternativas consideradas**: un único endpoint con filtros por rol (mezcla responsabilidades);
  GraphQL (fuera del stack obligatorio).

## D4. Sin borrado físico de platos

- **Decisión**: no existe `DELETE`; un plato deja de ofrecerse poniendo `activo = false` (baja
  manual) o por agotamiento de ingrediente. El registro se conserva siempre.
- **Razón**: FR-014 y los casos límite exigen preservar el historial de ventas; borrar rompería las
  cuentas de la historia 06 y los desgloses de la 07.
- **Alternativas consideradas**: borrado lógico con marca temporal de borrado y filtros adicionales
  (complejidad innecesaria frente al simple `activo`).

## D5. Partidas fijas

- **Decisión**: la partida es un enumerado validado `entrantes | principales | postres`; no hay
  entidad ni endpoints para gestionar partidas.
- **Razón**: FR-013 y la aclaración de la spec fijan las partidas; validar el enumerado rechaza
  valores no válidos (caso límite) sin crear catálogos.
- **Alternativas consideradas**: tabla de partidas gestionable (fuera de alcance; contradice la
  aclaración de partidas fijas).

## D6. Reflejo inmediato de los cambios

- **Decisión**: la carta vigente se lee de la base de datos en cada petición; no hay caché en
  servidor ni en cliente. Al guardar un cambio, la siguiente consulta de sala ya lo ve.
- **Razón**: cumple SC-002 y FR-009/FR-010 con la solución más simple; para un restaurante medio el
  coste de consulta es despreciable.
- **Alternativas consideradas**: caché con invalidación o notificaciones push/WebSocket (descartadas
  por innecesarias en v1 y fuera del stack).

## D7. Precio inmutable en pedidos ya tomados

- **Decisión**: la gestión de carta solo escribe sobre el plato (nombre, partida, precio, `activo`);
  nunca modifica el `precioUnitario` ya fijado en líneas de comanda existentes (historia 01,
  FR-019). El precio nuevo afecta solo a la carta vigente y a nuevos pedidos.
- **Razón**: FR-014 y los casos límite prohíben alterar cuentas del pasado; el precio fijado al
  pedir es la fuente para el cierre (06) y los informes (07).
- **Alternativas consideradas**: recalcular pedidos abiertos con el precio nuevo (rompería FR-014 y
  la coherencia con el cierre de cuenta).

## D8. Validación de precio y formato

- **Decisión**: el precio es un número en euros estrictamente mayor que cero; se rechazan valores
  vacíos, no numéricos o negativos con `400` y aviso en la UI. La presentación usa
  `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.
- **Razón**: FR-004 y FR-011; validar en backend y reflejar el mensaje en el formulario evita
  estados inválidos.
- **Alternativas consideradas**: validación solo en el cliente (eludible, descartada); guardar el
  precio como cadena formateada (dificulta cálculos, descartada).

## D9. Estrategia de pruebas

- **Decisión**: Vitest (unitarias de validación y cálculo de disponibilidad), Supertest (contrato e
  integración de los endpoints de gestión y de carta vigente sobre datos sembrados) y React Testing
  Library (estados de la página de gestión).
- **Razón**: un único runner reduce configuración; cubre reglas, contrato HTTP y UI, como exige la
  constitución ("sin pruebas, la funcionalidad no está completa").
- **Alternativas consideradas**: Jest (mayor configuración con Vite/ESM); solo pruebas manuales
  (descartado por la constitución).

## D10. Persistencia

- **Decisión**: SQLite con `better-sqlite3`, fichero persistente montado en un volumen Docker.
- **Razón**: persistencia necesaria para la carta e ingredientes; reproducible y sin servidor,
  coherente con la simplicidad y con un despliegue Docker sencillo.
- **Alternativas consideradas**: PostgreSQL/MySQL (servicio adicional no requerido en v1).
- **Nota de equipo**: decisión transversal al proyecto; debe confirmarse con el resto del equipo
  antes de implementar otras historias que escriban datos.

## D11. Comportamiento sin conexión

- **Decisión**: la aplicación exige conexión; si la página de gestión no puede cargar o guardar,
  muestra un estado de error/"sin conexión" claro y conserva lo escrito en pantalla, sin aplicar el
  cambio hasta recuperar la conexión.
- **Razón**: la aclaración de la spec descarta el funcionamiento sin conexión; no se permite
  confirmar ni modificar sin red.
- **Alternativas consideradas**: cola de cambios offline con sincronización posterior (fuera de
  alcance en v1).

## D12. Despliegue y ejecución

- **Decisión**: `docker-compose` con dos servicios (backend y frontend); backend expone la API y
  sirve los estáticos del frontend en producción; comandos documentados en `quickstart.md`.
- **Razón**: cumple la regla de contenedores de la constitución y garantiza un arranque
  reproducible en cualquier máquina del equipo.
- **Alternativas consideradas**: dos contenedores con proxy inverso aparte (más piezas de las
  necesarias en v1).
