# Phase 1 — Data Model: Señales de platos listos por mesa

Este documento describe las entidades que la historia 005 necesita. La historia es
principalmente de **lectura**: consume el estado de mesas y platos producido por las
historias 01–04 y escribe únicamente el **aviso de mesa**.

## Entidades

### Mesa (propiedad de la historia 01; aquí solo lectura)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la mesa |
| `numero` | texto | Identificador visible de la mesa en sala (p. ej. "12") |
| `abierta` | booleano | `true` mientras la mesa está en servicio |

**Reglas**: la vista de sala solo incluye mesas con `abierta = true` (FR-001).

### Plato de pedido / línea de pedido (propiedad de las historias 01–04; aquí solo lectura)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la línea |
| `mesa_id` | entero | Mesa a la que pertenece (relación N:1 con Mesa) |
| `partida` | enumerado | `entrantes` \| `principales` \| `postres` |
| `nombre` | texto | Nombre del plato |
| `cantidad` | entero | Unidades de la línea (≥ 1) |
| `estado` | enumerado | `pendiente` \| `listo` |
| `marcado_en` | marca de tiempo / nulo | Momento en que se marcó como listo; nulo si está pendiente |

**Reglas**:
- `estado` es **reversible**: un plato puede volver de `listo` a `pendiente` (FR-013).
- Al deshacer la marca, `marcado_en` vuelve a nulo (coherente con la historia 04).
- La marca afecta a la línea completa (todas sus unidades), no a unidades sueltas.

### Aviso de mesa (propiedad de esta historia 005)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único del aviso |
| `mesa_id` | entero | Mesa a la que se refiere (relación N:1 con Mesa) |
| `estado` | enumerado | `activo` \| `descartado` |
| `generado_en` | marca de tiempo | Momento en que la mesa se completó por primera vez en el aviso vigente |
| `descartado_en` | marca de tiempo / nulo | Momento en que el camarero descartó el aviso |
| `actualizado_en` | marca de tiempo | Última modificación del aviso |

**Reglas**:
- Existe como máximo **un aviso vigente por mesa**.
- Un aviso se crea cuando una mesa abierta pasa de no completa a completa (FR-005).
- Descartar un aviso requiere aviso `activo`; descartar dos veces no cambia el estado
  (idempotente) y descartar un aviso inexistente no está permitido (FR-009).
- Un aviso `descartado` no vuelve a estar `activo` mientras no se marque un **nuevo** plato
  como listo en esa mesa (FR-010).

### Vista de sala (modelo derivado, no persistido)

Agregado de solo lectura que alimenta la pantalla del camarero:

- `mesas`: lista de mesas abiertas, cada una con sus platos y el estado de cada plato.
- `completa`: `true` si la mesa está abierta y **todos** sus platos están en `listo`.
- `aviso`: el aviso vigente de la mesa (`activo` / `descartado`) si existe.

## Relaciones

```text
Mesa 1 ──── N Plato de pedido     (una mesa agrupa varios platos)
Mesa 1 ──── N Aviso de mesa        (histórico; como máximo 1 vigente)
Aviso N ─── 1 Mesa
```

## Reglas de validación y cálculo

1. **Completitud**: `mesa.completa = mesa.abierta AND ∀ plato ∈ mesa.platos : plato.estado = 'listo'`.
2. **Mesa sin platos**: no se considera completa; no genera aviso.
3. **Reversibilidad**: si tras estar completa un plato vuelve a `pendiente`, `mesa.completa`
   pasa a `false` y el aviso vigente deja de estar activo (se retira) (FR-013).
4. **Regeneración**: si un aviso fue descartado y posteriormente la mesa vuelve a completarse
   por un nuevo plato listo, se genera un aviso nuevo (`activo`).
5. **Mesa cerrada**: al dejar de estar abierta, deja de mostrarse y sus avisos dejan de
   considerarse (el cierre de cuenta pertenece a la historia 06).

## Transiciones de estado

```text
Plato de pedido
  pendiente ──(cocina marca listo)──▶ listo
  listo     ──(cocina deshace)──────▶ pendiente

Aviso de mesa
  (no existe) ──(mesa se completa)──▶ activo
  activo      ──(camarero descarta)─▶ descartado
  activo      ──(plato vuelve a pendiente)──▶ retirado
  descartado  ──(nuevo plato listo completa de nuevo la mesa)──▶ (nuevo aviso) activo
```
