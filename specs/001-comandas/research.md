# Phase 0 — Research: Abrir mesa y tomar pedido

**Feature**: `001-comandas` | **Date**: 2026-10-20

Este documento resuelve las incógnitas del *Technical Context* del plan. No quedan marcadores
`NEEDS CLARIFICATION` pendientes.

## 1. Stack de aplicación

- **Decision**: Frontend React 18 + Chakra UI (con Vite y JavaScript); backend ExpressJS 4 sobre
  Node.js 22 (JavaScript).
- **Rationale**: es el stack obligatorio fijado por la constitución del proyecto; no admite
  alternativas sin enmienda previa.
- **Alternatives considered**: ninguna (restricción de la constitución).

## 2. Persistencia

- **Decision**: SQLite en fichero persistido en un volumen Docker, accedido con `better-sqlite3` (better-sqlite3) y
  migraciones SQL versionadas.
- **Rationale**: los datos son relacionales (mesas, pedidos, líneas, platos, partidas) y deben ser
  compartidos entre varios dispositivos (sala y, más adelante, cocina); SQLite en un volumen Docker cumple
  el requisito de entorno reproducible. Se evita un ORM para mantener la simplicidad (SQL directo).
- **Alternatives considered**: SQLite (más simple, pero menos adecuado para varios clientes
  concurrentes y para el crecimiento del sistema); Firebase/Firestore (propuesto en el enunciado,
  pero descartado porque la constitución exige backend ExpressJS).

## 3. Importes y moneda

- **Decision**: guardar precios e importes como enteros en céntimos; formatear en € con
  `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`.
- **Rationale**: evita errores de coma flotante y respeta la convención española (constitución).
- **Alternatives considered**: decimal en base de datos (correcto pero más verboso en JS);
  `number` en euros (riesgo de redondeo).

## 4. Fijado del precio al pedir

- **Decision**: al añadir una línea de pedido se copia el precio vigente del plato en
  `linea_pedido.precio_centimos`; ese valor no se recalcula después.
- **Rationale**: decisión de clarificación de la spec (precio del momento de pedir); aísla la
  pedido de los cambios de carta de la historia 08.
- **Alternatives considered**: usar siempre el precio actual del plato (descartado: altera lo ya
  pedido).

## 5. Partidas

- **Decision**: las partidas son un catálogo fijo (entrantes, principales, postres) representado
  como tipo enumerado en base de datos; el plato referencia una partida y la línea de pedido
  hereda la partida del plato.
- **Rationale**: coincide con la spec 008 (partidas fijas) y simplifica la agrupación del pedido.
- **Alternatives considered**: tabla de partidas gestionable (fuera de alcance en v1).

## 6. Tiempo real entre sala y cocina

- **Decision**: se adopta Server-Sent Events (SSE) con un hub compartido del proyecto
  (`backend/src/realtime/hub.js`). Al confirmar, la historia publica un evento con el pedido
  agrupado por partidas y el frontend de sala se suscribe a `GET /api/eventos` para refrescar el
  estado en vivo.
- **Rationale**: SSE es unidireccional (servidor→cliente), nativo en el navegador y suficiente para
  notificar cambios; un único hub compartido evita duplicar la capa de tiempo real en las historias
  003–006.
- **Alternatives considered**: WebSocket (bidireccional, innecesario); refresco por sondeo
  (descartado por latencia).

## 7. Validación de entrada

- **Decision**: validar las peticiones de la API con `zod` (esquemas por endpoint).
- **Rationale**: validación declarativa, ligera y tipada con JavaScript; evita dependencias pesadas.
- **Alternatives considered**: validación manual (más propensa a errores); class-validator
  (orientado a decoradores, más pesado).

## 8. Identificación del camarero (autenticación)

- **Decision**: se asume un camarero ya identificado por el sistema (sesión existente) y su
  identificador llega al backend en cada petición; la historia 01 **no** implementa inicio de sesión
  ni gestión de usuarios.
- **Rationale**: ninguna historia define todavía autenticación ni roles; la spec 01 solo exige que
  "el camarero esté identificado". Se documenta como supuesto y dependencia.
- **Alternatives considered**: implementar login en esta historia (descartado: alcance no pedido).

## 9. Pruebas

- **Decision**: Vitest como runner común; React Testing Library para componentes de sala; Supertest
  para la API; SQLite real en fichero para pruebas de integración.
- **Rationale**: un único runner para frontend y backend reduce configuración; pruebas de
  integración contra SQLite evitan divergencias con producción.
- **Alternatives considered**: Vitest + Testing Library (más configuración con Vite/ESM);
  SQLite en memoria para tests (divergiría del motor real).

## 10. Estructura de repositorio

- **Decision**: monorepo con `backend/` y `frontend/` y `docker-compose.yml` en la raíz.
- **Rationale**: refleja el stack de dos capas y el requisito de contenedores; mantiene el arranque
  en un único comando.
- **Alternatives considered**: dos repositorios separados (más fricción para un equipo de 4).

## 11. Anulación de un pedido en curso

- **Decision**: al anular, se **eliminan** el pedido y sus líneas de la base de datos y la mesa
  vuelve a `libre`; no se persiste un estado `anulada` ni se emite ningún pedido hacia cocina.
- **Rationale**: la clarificación de la spec (2026-10-20) dice que el pedido "se descarta" y nada
  se envía; borrarlo es la opción más simple, no obliga a añadir un estado al enum, ni a filtrar
  pedidos anulados en consultas y en la restricción única parcial, y deja la mesa lista para un
  nuevo pedido. El borrado de líneas va en cascada dentro de la misma transacción que libera la
  mesa. Se publica un evento SSE «pedido-anulado» para que sala refresque el estado.
- **Alternatives considered**: estado `anulada` (conserva historial, pero añade complejidad y
  migración sin requisito que lo justifique); borrado lógico (mismo coste que el estado y residuos
  en la base de datos).
