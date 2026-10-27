# Plan de Implementación: Cierre y división de cuenta

**Rama**: `feature/006-cierre-cuenta-division` | **Fecha**: 2026-10-27 | **Spec**: [spec.md](./spec.md)

**Entrada**: Especificación de la historia 006, incluidas las clarificaciones del 2026-10-27.

## Resumen

El camarero cierra la cuenta de una mesa, calcula el total con los precios fijados al pedir,
puede dividirla en partes iguales o por consumo y registra el pago de cada parte. En una cuenta
dividida se emite **un único ticket final al pagarse la última parte**. Si una parte se marca por
error, puede volver a pendiente mientras la cuenta siga abierta.

Al completar el cobro, la **cuenta queda cerrada** y la **mesa vuelve a estar libre** para una
nueva comanda; la cuenta anterior se conserva como histórico. El cierre se rechaza mientras
existan platos pendientes en cocina, para no liberar una mesa con comida aún en preparación.

La API reutiliza la sesión y autorización de la historia 000: los endpoints exigen sesión con rol
`camarero`; no se aceptan identidades por cabecera ni por URL. La persistencia usa SQLite,
migraciones versionadas y el hub SSE compartido.

## Contexto Técnico

**Lenguaje/Versión**: JavaScript ES2022 sobre Node.js 22; React 18 y JSX en frontend.

**Dependencias principales**: React 18 + Chakra UI, ExpressJS 4, `better-sqlite3`, Vitest,
Supertest y React Testing Library. No se añaden frameworks ni pasarelas de pago.

**Autenticación**: historia 000. Cookie de sesión `HttpOnly`; `POST/GET` de cuentas requieren
`autenticar` + `requireRole('camarero')`. El backend es la fuente de verdad del permiso.

**Almacenamiento**: SQLite con migraciones versionadas. La historia 006 escribe `cuentas`,
`cuentas_partes` y `cuentas_parte_consumos`; lee mesas, pedidos y líneas de pedido. Se añade
`cuentas.pedido_id` para asociar cada cuenta a la comanda que la origina y permitir que una mesa
reutilizada tenga una cuenta nueva sin que la cerrada anterior la bloquee. El cierre actualiza
`mesas.estado`.

**Estado de mesa**: tras el cobro se usa `mesas.estado = 'libre'` y la mesa vuelve a aparecer en
sala como disponible. El valor `cerrada` deja de usarse para mesas de esta versión; no se borra
el dato histórico de la cuenta. Una nueva comanda crea un pedido y una cuenta nuevos. Las
consultas de cuenta/ticket se resuelven por el pedido actual o por la cuenta cerrada más reciente,
no por un estado global de la mesa.

**Estado de cocina**: las líneas enviadas tienen `estado = pendiente|listo`. El cierre se bloquea
si alguna línea de un pedido `enviada` de la mesa sigue pendiente. Las líneas de pedidos no
enviados no están en cocina y no forman parte de esta comprobación.

**Tiempo real**: al cerrar la cuenta se publica `mesa-cerrada` en el hub existente
(`GET /api/eventos`); la sala debe refrescar y mostrar la mesa como libre, no eliminarla del
inventario.

**Pruebas**: backend Vitest + Supertest (total, división, pagos, ticket, reutilización y bloqueo
por cocina); frontend Vitest + RTL (resumen, división, pago/reversión, ticket y avisos).

**Plataforma objetivo**: aplicación web en navegador de tablet/PC y servidor Node, reproducible
con Docker.

**Objetivos de rendimiento**: cierre en ≤ 2 min; división en ≤ 3 min; cálculo y respuesta de
cuenta/pago en ≤ 2 s.

**Restricciones**: conexión a la red local; precios con IVA incluido y sin desglose; UI con
Chakra UI; textos en español de España y euros; sin impresión, terminales de pago, propinas,
descuentos, anulaciones parciales ni recuperación de cuentas cerradas.

**Escala/Ámbito**: un restaurante, decenas de mesas y varias pantallas concurrentes.

## Verificación de la Constitución

*GATE: debe pasar antes de la investigación y volver a comprobarse tras el diseño.*

| Principio / regla | Comprobación | Estado |
|---|---|---|
| I. Simplicidad | Un flujo HTTP y una única persistencia de cuenta/partes; sin ORM ni estado global | Pasa |
| II. Español y euro | Textos, fechas e importes con convención española | Pasa |
| III. Cero alcance fantasma | Solo FR-001–FR-019: cierre, división, pagos, ticket, reutilización y bloqueo por cocina | Pasa |
| IV. Verificable por no técnico | Cerrar, dividir, pagar, reutilizar la mesa y ver pendientes desde la interfaz | Pasa |
| V. Datos con respeto | Solo etiqueta de comensal; sin secretos en el repositorio | Pasa |
| VI. Conventional Commits | Proceso de commits del equipo | Pasa |
| VII. Desarrollo en equipo | Docker, README y decisiones documentadas | Pasa |
| Tecnología obligatoria | React + Chakra UI y ExpressJS sobre Node | Pasa |
| Contenedores | `docker-compose` mantiene frontend, backend y SQLite en volumen | Pasa |
| Calidad y pruebas | Cada funcionalidad incluye pruebas automatizadas | Pasa |
| Flujo de trabajo | Rama de feature y Pull Request según Git Flow | Pasa |

**Resultado**: sin violaciones ni seguimiento de complejidad.

## Estructura del Proyecto

### Documentación

```text
specs/006-cierre-cuenta-division/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
└── tasks.md          # se regenera con /speckit.tasks; no lo genera este comando
```

### Código afectado (estado actual del repositorio)

```text
backend/
├── migrations/
│   ├── 001_init.sql             # mesas, pedidos y líneas (historias 001–004)
│   ├── 004_cuentas.sql          # cuentas, partes y consumos (006)
│   └── 007_cuenta_pedido.sql    # enlace cuenta–pedido para reutilizar mesas (006)
├── src/
│   ├── app.js                   # monta /api/sala y /api/auth
│   ├── middleware/autenticar.js # sesión desde cookie (historia 000)
│   ├── middleware/authorize.js  # requireRole('camarero')
│   ├── routes/cuentas.js        # cuenta, división, pagos, cierre y ticket
│   ├── services/cuentasService.js
│   ├── services/divisionService.js
│   ├── services/ticketService.js
│   ├── realtime/emit.js         # mesa-cerrada
│   └── db/mesas.js              # lectura/estado de mesas
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

frontend/
├── src/
│   ├── App.jsx
│   ├── pages/CierreCuenta.jsx
│   ├── hooks/useCuenta.js
│   ├── components/ResumenCuenta.jsx
│   ├── components/DivisionCuenta.jsx
│   ├── components/AsignarConsumos.jsx
│   ├── components/ParteCuenta.jsx
│   ├── components/TicketFinal.jsx
│   └── services/api.js
└── tests/
```

**Decisión de estructura**: se mantiene la arquitectura web actual. No se crea una capa nueva;
el backend añade la comprobación de cocina y el cambio de estado de mesa en el servicio de
cuentas, y el frontend muestra el aviso y la mesa libre.

## Frontera de datos y propiedad

- **006 escribe**: `cuentas` (incluido `pedido_id`), `cuentas_partes`, `cuentas_parte_consumos` y `mesas.estado`.
- **006 solo lee**: pedidos, líneas de pedido y platos para calcular consumos y detectar
  pendientes de cocina.
- **No reabre cuentas**: una cuenta cerrada es histórico; una nueva comanda crea una cuenta
  nueva.
- **No modifica líneas de cocina**: el cierre se bloquea; no cancela ni marca platos por su
  cuenta.

## Fases de implementación

### Fase 0 — Investigación

Resolver reutilización de mesas, bloqueo por cocina, estado de mesa, histórico de cuentas,
autenticación heredada y eventos de sala. Resultado: [research.md](./research.md).

### Fase 1 — Diseño

Actualizar [data-model.md](./data-model.md), [contracts/api.md](./contracts/api.md) y
[quickstart.md](./quickstart.md) para reflejar:

- asociación `cuentas.pedido_id` y consulta de la cuenta de la comanda actual;
- migración de enlace cuenta–pedido con el siguiente número disponible;

- mesa liberada al cerrar y nueva comanda sobre la misma mesa;
- bloqueo del cierre por líneas pendientes de pedidos enviados;
- contrato de error `platos_pendientes` y lista de platos;
- endpoints protegidos por sesión de camarero;
- ticket y cuentas cerradas como histórico.

### Fase 2 — Tareas

Regenerar `tasks.md` después de este plan. Las tareas antiguas que asumen
`mesas.estado = 'cerrada'` o que no comprueban cocina no son válidas y deben sustituirse.

## Seguimiento de Complejidad

No hay violaciones constitucionales ni complejidad que justificar. La comprobación de pendientes
es una consulta adicional y el cambio de estado de mesa es una transición directa; no se introduce
un nuevo canal de tiempo real ni una entidad de histórico separada.
