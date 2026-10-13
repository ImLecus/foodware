# Phase 0 — Research: Editar un pedido enviado

**Feature**: `002-editar-comanda` | **Date**: 2026-10-13

Resuelve las incógnitas del *Technical Context*. No quedan `NEEDS CLARIFICATION` pendientes.

## 1. Stack e infraestructura

- **Decision**: reutilizar exactamente el stack e infraestructura de la historia 001 (React 18 +
  Chakra UI; ExpressJS 4 sobre Node.js 20 + JavaScript; SQLite; Docker Compose; Vitest/RTL/
  Supertest).
- **Rationale**: es el stack obligatorio y ya existe la base; no se introduce nada nuevo.
- **Alternatives considered**: ninguna (restricción de la constitución).

## 2. Modelo de edición de un pedido enviado

- **Decision**: los endpoints de líneas de la historia 001 (añadir, modificar, retirar) pasan a
  admitir pedidos en estado `enviada`; al primer cambio real, el pedido se marca como `modificada`.
  Abrir para editar no requiere acción previa de reapertura (decisión de clarificación).
- **Rationale**: evita duplicar el pedido y mantiene una única entidad; coherente con la decisión
  de la 001/002 ("edición directa").
- **Alternatives considered**: crear un pedido "de corrección" (descartado: duplica pedidos).

## 3. Cambios pendientes vs. cambios enviados

- **Decision**: el pedido lleva `cambios_pendientes` (booleano). Editar la pone a `true`; la acción
  explícita **"enviar cambios"** la pone a `false` y actualiza `cambios_enviados_en`. Los cambios no
  se comunican solos al guardar.
- **Rationale**: implementa la clarificación (FR-014/SC-006) y separa "guardado en sala" de
  "comunicado a cocina".
- **Alternatives considered**: enviar siempre al guardar (descartado: cocina actuaría sobre cambios
  a medio hacer).

## 4. Bloqueo de edición

- **Decision**: bloqueo pesimista mediante columnas `editando_por` (camarero) y `editando_desde`
  (timestamp). Al abrir para editar se toma el bloqueo; se libera al terminar o al expirar (timeout,
  p. ej. 5 min). Si otro camarero tiene el bloqueo, la edición se rechaza con `423 Locked`.
- **Rationale**: la clarificación exige impedir la edición simultánea; el timeout evita bloqueos
  permanentes si un dispositivo se desconecta.
- **Alternatives considered**: bloqueo optimista con versión (descartado: la decisión pide bloquear,
  no resolver conflictos al guardar).

## 5. Trazabilidad de cambios

- **Decision**: tabla append-only `modificacion` con `pedido_id`, `camarero_id`, `tipo`
  (añadir/retirar/ajustar/corregir), `detalle` (JSONB) y `momento`.
- **Rationale**: FR-013 exige trazabilidad del cambio frente al pedido original.
- **Alternatives considered**: solo un flag `modificada` (insuficiente para auditar qué cambió).

## 6. Comunicación a cocina ("enviar cambios")

- **Decision**: la acción "enviar cambios" publica por SSE (hub compartido del proyecto) el pedido
  actualizado y marcado como modificado; la pantalla de sala escucha ese evento para refrescar.
- **Rationale**: reutiliza la infraestructura SSE ya adoptada en la 001, sin capa de tiempo real
  propia (simplicidad).
- **Alternatives considered**: WebSocket (descartado); notificar solo al consultar (latencia alta).

## 7. Reglas de integridad

- **Decision**: rechazar (`409`) cualquier operación que deje el pedido sin líneas (FR-011) y
  cualquier edición sobre un pedido que no esté `enviada` (p. ej. `cerrada`) (FR-012). Abrir para
  editar sin cambios no marca `modificada` (edge case).
- **Rationale**: cubre los casos límite de la spec sin estados intermedios innecesarios.
- **Alternatives considered**: permitir pedido vacío y avisar después (descartado: deja pedidos
  inválidos).

## 8. Identidad y mesas compartidas

- **Decision**: se reutiliza el middleware de identidad de la 001; cualquier camarero identificado
  puede editar el pedido de cualquier mesa (mesas compartidas), salvo que otro tenga el bloqueo.
- **Rationale**: decisiones de clarificación (cualquier camarero; mesas compartidas).
- **Alternatives considered**: restringir por camarero propietario (descartado por la clarificación).

## 9. Pruebas

- **Decision**: Vitest + Supertest para la API de edición (incluyendo bloqueo y enviar-cambios) y
  React Testing Library para el editor de pedido; SQLite real en fichero.
- **Rationale**: coherencia con la 001 y verificación de las reglas de integridad.
- **Alternatives considered**: mocks de BD (descartado: menos fieles para bloqueos/transacciones).
