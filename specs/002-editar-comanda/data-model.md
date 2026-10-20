# Phase 1 — Data Model: Editar un pedido enviado

**Feature**: `002-editar-comanda` | **Date**: 2026-10-20

Extiende el modelo de la historia 001. Importes en céntimos enteros; SQLite.

## Pedido (ampliada)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Heredado de 001 |
| `mesa_id` | Mesa (FK) | Obligatorio (heredado) |
| `camarero_id` | texto | Camarero que tomó el pedido (heredado) |
| `estado` | texto | `en_curso`, `enviada` o `cerrada` |
| `creada_en` | timestamp | Heredado |
| `confirmada_en` | timestamp (nullable) | Heredado |
| `modificada` | booleano | `true` desde la primera edición real de un pedido enviado |
| `cambios_pendientes` | booleano | `true` si hay ediciones no comunicadas a cocina |
| `cambios_enviados_en` | timestamp (nullable) | Momento del último "enviar cambios" |
| `editando_por` | texto (nullable) | Camarero que tiene el bloqueo de edición |
| `editando_desde` | timestamp (nullable) | Inicio del bloqueo |
| `editando_ultima_actividad` | timestamp (nullable) | Última interacción del camarero con el editor; se refresca al guardar un cambio |
| `bloqueo_expira_en` | timestamp (nullable) | `editando_ultima_actividad` + periodo de inactividad; a partir de ahí el bloqueo se considera libre |

- **Estados**: `en_curso` → `enviada` (001) → `cerrada` (006). La edición aplica solo a `enviada`.
- **Migración**: la migración de esta historia añade el valor `cerrada` al estado de `pedido` (lo
  introduce la 006) para poder validar FR-012.
- **Reglas**:
  - No se puede editar si `estado` no es `enviada` (FR-012).
  - No se puede editar si otro camarero tiene un bloqueo vigente (FR-015).
  - Editar no cambia el `id` ni `mesa_id` (FR-007, FR-008).
  - `modificada` pasa a `true` solo con el primer cambio real; abrir sin cambios no la marca.
  - Un bloqueo con `bloqueo_expira_en` anterior al momento actual se considera **expirado** y libre,
    aunque las columnas aún guarden al camarero anterior (se limpian de forma perezosa).

## Bloqueo de edición

Estado derivado del pedido; no crea una tabla nueva.

| Concepto | Cómo se representa | Reglas |
|----------|--------------------|--------|
| Pedido bloqueado | `editando_por` no nulo **y** `bloqueo_expira_en` > ahora | Solo el camarero de `editando_por` puede modificar o enviar cambios |
| Camarero | `editando_por` | Identidad de la historia 001 |
| Inicio | `editando_desde` | Se fija al tomar el bloqueo |
| Última actividad | `editando_ultima_actividad` | Se actualiza al guardar un cambio; no se refresca por el mero paso del tiempo |
| Expiración | `bloqueo_expira_en` | `editando_ultima_actividad` + periodo de inactividad |

- **Periodo de inactividad**: configurable con `BLOQUEO_INACTIVIDAD_MINUTOS` (por defecto **15**
  minutos); un valor mayor mantiene el bloqueo más tiempo y uno menor lo libera antes. Una edición
  muy larga sin guardar puede caducar; el camarero debe reabrir el pedido.
- **Cálculo**: `bloqueo_expira_en = editando_ultima_actividad + periodo`. La caducidad se evalúa de
  forma perezosa en cada lectura u operación sobre el pedido; no hay temporizador.
- **Estados observables**: `libre` (sin `editando_por`), `bloqueado` (vigente) o `expirado`
  (registro residual cuyo `bloqueo_expira_en` ya pasó; se trata como libre).

## Línea de pedido (ampliada)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Heredado de 001 |
| `pedido_id` | Pedido (FK) | Heredado |
| `plato_id` | Plato (FK) | Heredado |
| `cantidad` | entero | ≥ 1 |
| `precio_centimos` | entero | Precio fijado en el momento de pedir (001); se fija al añadir en una edición |
| `indicaciones` | texto (nullable) | **Nuevo**: observaciones del cliente; editable |
| `partida` | Partida | Derivada del plato |

- **Reglas**: se puede añadir, retirar, ajustar cantidad y corregir indicaciones (FR-002…FR-005).
- **Restricción**: una edición no puede dejar el pedido con 0 líneas (FR-011).

## Modificación de pedido (nueva)

Registro append-only para trazabilidad (FR-013).

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `pedido_id` | Pedido (FK) | Obligatorio |
| `camarero_id` | texto | Autor del cambio |
| `tipo` | texto | `anadir`, `retirar`, `ajustar_cantidad`, `corregir_indicaciones` |
| `linea_id` | UUID (nullable) | Línea afectada (si aplica) |
| `detalle` | JSONB | Datos del cambio (valores anterior y nuevo) |
| `momento` | timestamp | Momento del cambio |

- **Relaciones**: muchas `Modificacion` por `Pedido`.
- **Reglas**: solo se inserta; nunca se modifica ni se borra (auditoría).

## Transiciones de estado

```text
Pedido.estado:   en_curso ──(confirmar, 001)──▶ enviada ──(cerrar, 006)──▶ cerrada

Edición (sobre "enviada"):
  abrir para editar ──▶ bloqueado
                        (editando_por, editando_desde,
                         editando_ultima_actividad, bloqueo_expira_en)
  guardar cambio    ──▶ modificada = true, cambios_pendientes = true, + Modificacion
                        y refresco de editando_ultima_actividad / bloqueo_expira_en
  enviar cambios    ──▶ cambios_pendientes = false, cambios_enviados_en = ahora
                        y bloqueo liberado (editando_por = null)

Bloqueo:
  bloqueado ──(enviar cambios)──────────▶ liberado
  bloqueado ──(cancelar o salir)────────▶ liberado
  bloqueado ──(bloqueo_expira_en < ahora)▶ expirado ──(siguiente acceso)──▶ liberado
```

Reglas de validación asociadas:

- Editar solo si `estado = enviada` (FR-012).
- Rechazar con `423` si otro camarero tiene el bloqueo vigente (FR-015).
- Rechazar con `409` y `codigo: bloqueo_expirado` si el solicitante ya no posee un bloqueo vigente
  (su bloqueo caducó); debe reabrir el pedido.
- Rechazar dejar 0 líneas (FR-011).
- Los cambios no se comunican solos: requieren "enviar cambios" (FR-014).
- Enviar cambios, cancelar/salir y la expiración liberan siempre el bloqueo; ningún pedido queda
  bloqueado indefinidamente (SC-007).

## Vista de pedido agrupado por partidas

Se reutiliza la vista derivada de la 001; tras "enviar cambios" refleja el estado actualizado de la
pedido (marcado como modificado). La consume la vista de cocina (historias 003–005).

## Eventos SSE

El hub SSE compartido (`backend/src/realtime/hub.js`) emite eventos de estado; esta historia publica
«pedido-modificado» y el frontend se suscribe vía `GET /api/eventos`.
