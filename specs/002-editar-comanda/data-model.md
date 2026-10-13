# Phase 1 — Data Model: Editar una comanda enviada

**Feature**: `002-editar-comanda` | **Date**: 2026-10-13

Extiende el modelo de la historia 001. Importes en céntimos enteros; PostgreSQL 16.

## Comanda (ampliada)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Heredado de 001 |
| `mesa_id` | Mesa (FK) | Obligatorio (heredado) |
| `camarero_id` | texto | Camarero que tomó la comanda (heredado) |
| `estado` | texto | `en_curso`, `enviada` o `cerrada` |
| `creada_en` | timestamp | Heredado |
| `confirmada_en` | timestamp (nullable) | Heredado |
| `modificada` | booleano | `true` desde la primera edición real de una comanda enviada |
| `cambios_pendientes` | booleano | `true` si hay ediciones no comunicadas a cocina |
| `cambios_enviados_en` | timestamp (nullable) | Momento del último "enviar cambios" |
| `editando_por` | texto (nullable) | Camarero que tiene el bloqueo de edición |
| `editando_desde` | timestamp (nullable) | Inicio del bloqueo (para expiración) |

- **Estados**: `en_curso` → `enviada` (001) → `cerrada` (006). La edición aplica solo a `enviada`.
- **Reglas**:
  - No se puede editar si `estado` no es `enviada` (FR-012).
  - No se puede editar si `editando_por` está ocupado por otro camarero y no ha expirado (FR-015).
  - Editar no cambia el `id` ni `mesa_id` (FR-007, FR-008).
  - `modificada` pasa a `true` solo con el primer cambio real; abrir sin cambios no la marca.

## Línea de comanda (ampliada)

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Heredado de 001 |
| `comanda_id` | Comanda (FK) | Heredado |
| `plato_id` | Plato (FK) | Heredado |
| `cantidad` | entero | ≥ 1 |
| `precio_centimos` | entero | Precio fijado en el momento de pedir (001); se fija al añadir en una edición |
| `indicaciones` | texto (nullable) | **Nuevo**: observaciones del cliente; editable |
| `partida` | Partida | Derivada del plato |

- **Reglas**: se puede añadir, retirar, ajustar cantidad y corregir indicaciones (FR-002…FR-005).
- **Restricción**: una edición no puede dejar la comanda con 0 líneas (FR-011).

## Modificación de comanda (nueva)

Registro append-only para trazabilidad (FR-013).

| Campo | Tipo | Reglas |
|-------|------|--------|
| `id` | UUID (PK) | Generado por el sistema |
| `comanda_id` | Comanda (FK) | Obligatorio |
| `camarero_id` | texto | Autor del cambio |
| `tipo` | texto | `anadir`, `retirar`, `ajustar_cantidad`, `corregir_indicaciones` |
| `linea_id` | UUID (nullable) | Línea afectada (si aplica) |
| `detalle` | JSONB | Datos del cambio (valores anterior y nuevo) |
| `momento` | timestamp | Momento del cambio |

- **Relaciones**: muchas `Modificacion` por `Comanda`.
- **Reglas**: solo se inserta; nunca se modifica ni se borra (auditoría).

## Transiciones de estado

```text
Comanda.estado:   en_curso ──(confirmar, 001)──▶ enviada ──(cerrar, 006)──▶ cerrada

Edición (sobre "enviada"):
  abrir para editar ──▶ bloqueo (editando_por = camarero)
  guardar cambio    ──▶ modificada = true, cambios_pendientes = true, + Modificacion
  enviar cambios    ──▶ cambios_pendientes = false, cambios_enviados_en = ahora
  terminar/expirar  ──▶ bloqueo liberado (editando_por = null)
```

Reglas de validación asociadas:

- Editar solo si `estado = enviada` (FR-012).
- Rechazar si otro camarero tiene el bloqueo vigente (FR-015).
- Rechazar dejar 0 líneas (FR-011).
- Los cambios no se comunican solos: requieren "enviar cambios" (FR-014).

## Vista de pedido agrupado por partidas

Se reutiliza la vista derivada de la 001; tras "enviar cambios" refleja el estado actualizado de la
comanda (marcada como modificada). La consume la vista de cocina (historias 003–005).
