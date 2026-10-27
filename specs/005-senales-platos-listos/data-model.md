# Phase 1 — Data Model: Señales de platos listos por mesa

Este documento describe las entidades que la historia 005 necesita. La historia es
principalmente de **lectura** (consume el estado de mesas y platos producido por las
historias 01–04) y escribe dos cosas: el **aviso de mesa** y el **estado de la línea** al
marcar/deshacer un plato como listo (FR-016, mecanismo mínimo de esta historia).

> Todos los datos viven en el esquema compartido `backend/migrations/001_init.sql`; esta
> historia **no añade ninguna migración nueva** ni modifica tablas existentes.

## Entidades

### Mesa (tabla `mesas`, propiedad de la historia 01; aquí solo lectura)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador único de la mesa |
| `identificador` | texto | Nombre visible de la mesa en sala (p. ej. "Mesa 1") |
| `estado` | enumerado | `libre` \| `ocupada` \| `cerrada` |

**Reglas**: la vista de sala solo incluye mesas **abiertas**. Una mesa está abierta mientras
tenga una comanda **en curso o ya enviada a cocina** y no se haya cerrado su cuenta (FR-001,
FR-011). En el esquema, esto corresponde a `mesas.estado = 'ocupada'`; el cierre de cuenta
(historia 06) es lo que la saca de la vista.

### Línea de pedido / plato (tabla `lineas_pedido`, propiedad de las historias 01–04)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador único de la línea |
| `pedido_id` | texto | Pedido al que pertenece (relación N:1 con Pedido) |
| `plato_id` | texto | Plato de la carta (relación N:1 con Plato) |
| `cantidad` | entero | Unidades de la línea (≥ 1) |
| `precio_centimos` | entero | Precio unitario fijado al pedir (céntimos, > 0) |
| `estado` | enumerado | `pendiente` \| `listo` |
| `listo_en` | marca de tiempo / nulo | Momento en que se marcó como listo; nulo si pendiente |

La vista de sala solo considera las líneas de pedidos **ya enviados a cocina**
(`pedidos.estado = 'enviada'`); las líneas de un pedido `en_curso` (sin confirmar) no
aparecen ni cuentan para la completitud (FR-001, FR-005).

**Reglas**:
- `estado` es **reversible**: un plato puede volver de `listo` a `pendiente` (FR-013).
- Al deshacer la marca, `listo_en` vuelve a nulo (coherente con la historia 04).
- La marca afecta a la línea completa (todas sus unidades), no a unidades sueltas.
- **Escritura de esta historia (FR-016)**: el marcado/desmarcado es el único cambio que la
  005 hace sobre esta tabla; el resto de sus campos son propiedad de las historias 01–03.

### Aviso de mesa (tabla `avisos`, propiedad de esta historia 005)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador único del aviso |
| `mesa_id` | texto | Mesa a la que se refiere (relación N:1 con Mesa) |
| `estado` | enumerado | `activo` \| `descartado` |
| `generado_en` | marca de tiempo | Momento en que se completó la mesa y se generó el aviso |
| `descartado_en` | marca de tiempo / nulo | Momento en que el camarero descartó el aviso |

**Reglas**:
- Existe como máximo **un aviso vigente por mesa** (el último).
- El `estado` del aviso es **global por mesa**: no se guarda por camarero ni por
  dispositivo. Cualquier camarero que descarte el aviso cambia el mismo estado para toda
  la sala (FR-009).
- Un aviso se crea cuando una mesa abierta pasa de no completa a completa (FR-005).
- Descartar un aviso requiere aviso `activo`; descartar dos veces no cambia el estado
  (idempotente) y descartar un aviso inexistente no está permitido (FR-009).
- Al descartarlo, el aviso pasa a `descartado` para todos los camareros y deja de
  mostrarse en todas las pantallas (FR-009, FR-010); el backend difunde el cambio por el
  hub SSE compartido (SC-009).
- Un aviso `descartado` no vuelve a estar `activo` mientras no se marque un **nuevo** plato
  como listo en esa mesa (FR-010); en ese momento se crea un aviso nuevo (`activo`) que
  vuelve a mostrarse en todas las pantallas.
- Al **cerrarse la cuenta** de la mesa (deja de estar abierta), su aviso activo se **retira**
  y deja de mostrarse en todas las pantallas (FR-010). El cierre de cuenta pertenece a la
  historia 06; la 005 solo deja la regla "mesa no abierta ⇒ sin aviso" preparada para ella.

### Vista de sala (modelo derivado, no persistido)

Agregado de solo lectura que alimenta la pantalla del camarero:

- `mesas`: lista de mesas abiertas, cada una con las líneas de su comanda **ya enviada** y
  el estado de cada plato, agrupadas por partida (entrantes → principales → postres).
- `completa`: `true` si la mesa está abierta y **todas sus líneas enviadas** están en `listo`
  (una mesa sin líneas enviadas nunca está completa).
- `aviso`: el aviso vigente de la mesa (`activo` / `descartado`) si existe. Solo se
  muestra la señal de los avisos `activo`; un aviso `descartado` se oculta en todas las
  pantallas (FR-010).

## Relaciones

```text
Mesa 1 ──── N Pedido 1 ──── N Línea de pedido   (una mesa agrupa las líneas de su comanda)
Mesa 1 ──── N Aviso de mesa                      (histórico; como máximo 1 vigente)
Aviso N ─── 1 Mesa
```

## Reglas de validación y cálculo

1. **Completitud**: `mesa.completa = mesa.abierta AND (∃ al menos una línea enviada) AND
   ∀ línea enviada ∈ mesa : línea.estado = 'listo'`.
2. **Mesa sin platos enviados**: no se considera completa; no genera aviso. Una mesa abierta
   cuya comanda aún está en curso aparece en la lista, pero sin platos marcables y sin aviso.
3. **Reversibilidad**: si tras estar completa un plato vuelve a `pendiente`, `mesa.completa`
   pasa a `false` y el aviso vigente deja de estar activo (se retira) (FR-013).
4. **Edición de una comanda ya enviada**: la completitud se **recalcula** con el mismo criterio
   tras añadir, cambiar o retirar un plato (FR-013). El recálculo se dispara al confirmar los
   cambios de la comanda (`POST /api/pedidos/{pedidoId}/enviar-cambios`, punto de integración de
   la historia 002), no en cada operación individual sobre las líneas. Los platos ya listos que no
   se toquen conservan `estado = 'listo'`; si la edición incorpora un plato pendiente, la mesa deja
   de estar completa y el aviso vigente se retira; al marcarse ese plato como listo se genera un
   aviso nuevo (`activo`).
5. **Regeneración**: si un aviso fue descartado y posteriormente la mesa vuelve a completarse
   por un nuevo plato listo, se genera un aviso nuevo (`activo`) (FR-010).
6. **Mesa cerrada**: al dejar de estar abierta (cuenta cerrada), deja de mostrarse y sus avisos
   dejan de considerarse; si tenía un aviso activo, éste se retira y desaparece de todas las
   pantallas (FR-010). El cierre de cuenta pertenece a la historia 06.

## Transiciones de estado

```text
Línea de pedido (con el pedido ya enviado a cocina)
  pendiente ──(cocina marca listo)──▶ listo        [fija listo_en]
  listo     ──(cocina deshace)──────▶ pendiente    [listo_en = NULL]
  (edición de la comanda: añadir/cambiar/retirar un plato ⇒ se recalcula la completitud; los
   platos listos que no se tocan siguen listos, un plato nuevo entra como `pendiente`)

Aviso de mesa (estado global por mesa, compartido por todos los camareros)
  (no existe) ──(mesa se completa)──▶ activo
  activo      ──(cualquier camarero descarta)──▶ descartado   [difundido por SSE a todas las pantallas]
  activo      ──(plato vuelve a pendiente, o edición confirmada añade un plato pendiente)──▶ retirado
  activo      ──(se cierra la cuenta de la mesa, historia 06)──▶ retirado
  descartado  ──(nuevo plato listo completa de nuevo la mesa)──▶ (nuevo aviso) activo
```

El descarte no se guarda por dispositivo: la transición `activo → descartado` se aplica al
aviso de la mesa y se difunde por el hub SSE compartido, de modo que todas las pantallas
conectadas convergen al mismo estado (FR-009, FR-010, SC-009).
