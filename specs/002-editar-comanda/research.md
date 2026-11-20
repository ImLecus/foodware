# Phase 0 — Research: Editar un pedido enviado

**Feature**: `002-editar-comanda` | **Date**: 2026-10-20

Resuelve las incógnitas del *Technical Context*. No quedan `NEEDS CLARIFICATION` pendientes.

## 1. Stack e infraestructura

- **Decision**: reutilizar exactamente el stack e infraestructura de la historia 001 (React 18 +
  Chakra UI; ExpressJS 4 sobre Node.js 22 + JavaScript; SQLite; Docker Compose; Vitest/RTL/
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
  explícita **"enviar cambios"** la pone a `false`, actualiza `cambios_enviados_en` y libera el
  bloqueo de edición. Los cambios no se comunican solos al guardar.
- **Rationale**: implementa la clarificación (FR-014/SC-006) y separa "guardado en sala" de
  "comunicado a cocina".
- **Alternatives considered**: enviar siempre al guardar (descartado: cocina actuaría sobre cambios
  a medio hacer).

## 4. Bloqueo de edición y caducidad por inactividad

- **Decision**: bloqueo pesimista mediante columnas `editando_por` (camarero), `editando_desde`
  (inicio), `editando_ultima_actividad` (última interacción) y `bloqueo_expira_en`
  (`última actividad + periodo`). Al abrir para editar se toma el bloqueo; se libera al **enviar
  cambios**, al **cancelar o salir de la edición** y al **expirar por inactividad**. Si otro
  camarero tiene el bloqueo vigente, la edición se rechaza con `423 Locked`; si el solicitante
  perdió su bloqueo, se rechaza con `409` y `codigo: bloqueo_expirado`.
- **Caducidad**: comprobación **perezosa** en cada operación que toca el pedido (si
  `bloqueo_expira_en < ahora`, el bloqueo se considera libre y se limpia), sin temporizadores ni
  procesos en segundo plano. Periodo por defecto **15 minutos**, configurable con
  `BLOQUEO_INACTIVIDAD_MINUTOS`.
- **Rationale**: cubre la clarificación aprobada (liberación por envío, cancelación/salida e
  inactividad) y evita bloqueos permanentes si un dispositivo se desconecta. La comprobación
  perezosa es la opción más simple: no añade dependencias, no mantiene estado en memoria y
  sobrevive a reinicios del backend. 15 minutos cubre una edición normal sin retener el pedido
  demasiado tiempo si el camarero abandona.
- **Alternatives considered**: temporizador por bloqueo (descartado: complejidad, estado en memoria
  y trabajo de limpieza innecesario); timeout de 5 minutos (descartado: interrumpe ediciones
  legítimas); sin caducidad (descartado: deja pedidos bloqueados indefinidamente); bloqueo
  optimista con versión (descartado: la decisión pide bloquear, no resolver conflictos al guardar).

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

- **Decision**: rechazar (`409`) cualquier operación que deje el pedido sin líneas (FR-011),
  cualquier edición sobre un pedido que no esté `enviada` (p. ej. `cerrada`) (FR-012) y cualquier
  operación de edición sin bloqueo vigente del solicitante (`codigo: bloqueo_expirado`). Abrir para
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

- **Decision**: Vitest + Supertest para la API de edición (incluyendo bloqueo, su caducidad por
  inactividad y enviar-cambios) y React Testing Library para el editor de pedido; SQLite real en
  fichero.
- **Rationale**: coherencia con la 001 y verificación de las reglas de integridad.
- **Alternatives considered**: mocks de BD (descartado: menos fieles para bloqueos/transacciones).

## 10. Cancelación de un pedido enviado

- **Decision**: `POST /pedidos/{id}/cancelar` cambia el pedido a `cancelada`, retira el pedido y
  sus líneas de las vistas de cocina/sala, libera la mesa si no tiene otra comanda y registra una
  modificación de tipo `cancelar` (tipo, momento y usuario). No genera consumo ni cobro. Solo se
  permite si el pedido está `enviada` y no tiene partes pagadas.
- **Rationale**: la clarificación 2026-11-03 aprobó la cancelación completa desde sala; es la única
  forma coherente de liberar la mesa y evitar platos pendientes que bloqueen el cierre (006).
- **Alternatives considered**: retirar platos uno a uno (no libera la mesa de forma explícita y
  complica la trazabilidad); exigir que cocina marque todo listo (bloquea la mesa y no representa
  una cancelación real).

## 11. Bloqueo de edición extendido a cocina

- **Decision**: mientras `editando_por` esté vigente, las operaciones de cocina (004/005) sobre las
  líneas del pedido se rechazan; al liberar el bloqueo, cocina opera sobre el estado resultante.
  La comprobación se centraliza en el servicio de edición.
- **Rationale**: evita que cocina marque un plato que el camarero está retirando o cambiando, y
  mantiene una única fuente de verdad; la clarificación 2026-11-03 eligió esta opción por
  simplicidad.
- **Alternatives considered**: permitir cocina y descartar marcas al retirar (más complejo y
  propenso a contradicciones); bloquear solo los platos ya listos (reglas asimétricas).

## 12. Línea lista y cambio de cantidad

- **Decision**: `lineas_pedido` incorpora `estado` (`pendiente|listo`) y `listo_en`. Si una línea
  lista cambia de cantidad, sigue lista cuando la cantidad baja o se mantiene, y vuelve a
  `pendiente` borrando `listo_en` cuando sube. La completitud de la mesa la recalcula 005.
- **Rationale**: lo ya preparado cubre una reducción; un aumento exige preparar unidades nuevas. Es
  la regla aprobada en la clarificación 2026-11-03 y evita servir unidades no preparadas.
- **Alternatives considered**: cualquier cambio vuelve a pendiente (obliga a recocinar de más);
  seguir siempre lista (podría servir unidades no preparadas).

## 13. Disponibilidad de la carta

- **Decision**: un cambio de disponibilidad (008) no retira automáticamente líneas de pedidos ya
  enviados; el camarero puede retirarlas o cancelar el pedido. La línea conserva su instantánea de
  nombre, partida y precio.
- **Rationale**: respeta el pedido ya aceptado y evita modificaciones silenciosas; la decisión de
  2026-11-03 remite el tratamiento a 002.
- **Alternatives considered**: retirada automática (sorprende a cocina y al cliente); bloquear la
  baja mientras haya pedidos (impide gestionar la carta).

## 14. Trazabilidad con usuario

- **Decision**: cada `modificacion` guarda `pedido_id`, `camarero_id` (usuario), `tipo`
  (añadir/retirar/ajustar/corregir/cancelar), `linea_id`, `detalle` y `momento`. La vista de cocina
  solo muestra el aviso «Modificado»; el detalle queda para auditoría.
- **Rationale**: la clarificación 2026-11-03 pide trazabilidad con usuario sin recargar la vista de
  cocina; 003 confirma que no necesita el detalle.
- **Alternatives considered**: solo un flag `modificada` (insuficiente para auditar); historial
  completo con valores anteriores/nuevos (más almacenamiento del necesario).

## 15. Edición bloqueada con partes pagadas

- **Decision**: antes de editar o cancelar un pedido, se comprueba si la cuenta asociada tiene
  alguna parte `pagada`; si la hay, se rechaza con `409 partes_pagadas` y se pide deshacer los
  pagos (006). Con la división iniciada pero sin pagos, la edición sigue permitida y la división se
  reinicia.
- **Rationale**: evita perder o duplicar cobros; la clarificación 2026-11-03 eligió bloquear hasta
  deshacer los pagos por ser la opción más simple y segura.
- **Alternatives considered**: tratar lo pagado como pago a cuenta (requiere recalcular y puede
  dejar saldos negativos); permitir editar perdiendo la división (pierde trazabilidad del cobro).
