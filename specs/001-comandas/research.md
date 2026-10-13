# Phase 0 — Research: Abrir mesa y tomar comanda

**Feature**: `001-comandas` | **Date**: 2026-10-13

Este documento resuelve las incógnitas del *Technical Context* del plan. No quedan marcadores
`NEEDS CLARIFICATION` pendientes.

## 1. Stack de aplicación

- **Decision**: Frontend React 18 + Chakra UI (con Vite y TypeScript); backend ExpressJS 4 sobre
  Node.js 20 (TypeScript).
- **Rationale**: es el stack obligatorio fijado por la constitución del proyecto; no admite
  alternativas sin enmienda previa.
- **Alternatives considered**: ninguna (restricción de la constitución).

## 2. Persistencia

- **Decision**: PostgreSQL 16 ejecutado como servicio Docker, accedido con `pg` (node-postgres) y
  migraciones SQL versionadas.
- **Rationale**: los datos son relacionales (mesas, comandas, líneas, platos, partidas) y deben ser
  compartidos entre varios dispositivos (sala y, más adelante, cocina); PostgreSQL en Docker cumple
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

- **Decision**: al añadir una línea de comanda se copia el precio vigente del plato en
  `linea_comanda.precio_centimos`; ese valor no se recalcula después.
- **Rationale**: decisión de clarificación de la spec (precio del momento de pedir); aísla la
  comanda de los cambios de carta de la historia 08.
- **Alternatives considered**: usar siempre el precio actual del plato (descartado: altera lo ya
  pedido).

## 5. Partidas

- **Decision**: las partidas son un catálogo fijo (entrantes, principales, postres) representado
  como tipo enumerado en base de datos; el plato referencia una partida y la línea de comanda
  hereda la partida del plato.
- **Rationale**: coincide con la spec 008 (partidas fijas) y simplifica la agrupación del pedido.
- **Alternatives considered**: tabla de partidas gestionable (fuera de alcance en v1).

## 6. Tiempo real entre sala y cocina

- **Decision**: en esta historia la confirmación persiste la comanda y expone el pedido agrupado por
  partidas mediante la API; la difusión en vivo a las pantallas de cocina (historias 003–005) se
  implementará en sus propias historias. El frontend de sala refresca el estado consultando la API.
- **Rationale**: evita construir infraestructura de tiempo real (WebSocket/SSE) antes de que exista
  la pantalla que la consume (principio de simplicidad y "cero alcance fantasma").
- **Alternatives considered**: introducir WebSocket ya en la historia 01 (descartado por
  complejidad anticipada).

## 7. Validación de entrada

- **Decision**: validar las peticiones de la API con `zod` (esquemas por endpoint).
- **Rationale**: validación declarativa, ligera y tipada con TypeScript; evita dependencias pesadas.
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
  para la API; PostgreSQL real en contenedor para pruebas de integración.
- **Rationale**: un único runner para frontend y backend reduce configuración; pruebas de
  integración contra PostgreSQL evitan divergencias con producción.
- **Alternatives considered**: Jest + Testing Library (más configuración con Vite/ESM);
  SQLite en memoria para tests (divergiría del motor real).

## 10. Estructura de repositorio

- **Decision**: monorepo con `backend/` y `frontend/` y `docker-compose.yml` en la raíz.
- **Rationale**: refleja el stack de dos capas y el requisito de contenedores; mantiene el arranque
  en un único comando.
- **Alternatives considered**: dos repositorios separados (más fricción para un equipo de 4).
