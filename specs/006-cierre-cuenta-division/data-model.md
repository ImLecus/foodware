# Phase 1 — Data Model: Cierre y división de cuenta

Actualizado el 2026-10-27 con las clarificaciones de reutilización de mesa y bloqueo por
platos pendientes de cocina.

La historia **lee** mesas, pedidos y líneas de pedido de las historias 001–004, **escribe** la
cuenta, sus partes y las asignaciones de consumo, y **libera** la mesa al cerrar la cuenta. La
cuenta cerrada se conserva como histórico; no se reabre.

## Entidades

### Mesa (propiedad de la historia 001; aquí lectura y liberación)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador único de la mesa. |
| `identificador` | texto | Nombre visible de la mesa en sala (por ejemplo, «Mesa 12»). |
| `estado` | enumerado | `libre` \| `ocupada` \| `cerrada`; 006 deja de producir `cerrada` al cobrar y usa `libre`. |

**Reglas**:
- Solo se puede cerrar la cuenta de una mesa que tenga un pedido en curso o enviado y no tenga
  otra cuenta abierta en cobro.
- Al cerrar la cuenta, la mesa pasa a `libre` en la misma transacción (FR-011, clarificación
  2026-10-27). Puede abrirse una comanda nueva inmediatamente.
- La cuenta cerrada no se reabre. La nueva comanda crea un pedido y una cuenta nuevos.
- El valor heredado `cerrada` no se usa para nuevas mesas de esta versión; si existe en datos
  antiguos, se trata como una mesa no disponible hasta que se migre o se libere manualmente.

### Pedido (propiedad de las historias 001–004; aquí solo lectura)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador del pedido. |
| `mesa_id` | texto | Mesa a la que pertenece. |
| `estado` | enumerado | `en_curso` \| `enviada` \| `cerrada`. |
| `enviado_en` | fecha | Momento de envío a cocina. |

**Reglas**:
- Los consumos de una mesa son las líneas de sus pedidos `en_curso` y `enviada` con precio
  fijado al pedir.
- Solo las líneas de pedidos `enviada` están en cocina y participan en el bloqueo de cierre.

### Consumo / línea de pedido (propiedad de las historias 001–004; aquí solo lectura)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador de la línea. |
| `pedido_id` | texto | Pedido al que pertenece. |
| `plato_id` | texto | Plato de la carta. |
| `nombre` | texto | Nombre del plato en el momento de la consulta. |
| `cantidad` | entero | Unidades (≥ 1). |
| `partida` | enumerado | `entrantes` \| `principales` \| `postres`. |
| `precio_centimos` | entero | Precio unitario fijado al pedir, IVA incluido. |
| `estado` | enumerado | `pendiente` \| `listo`. |
| `listo_en` | fecha / nulo | Momento en que cocina la marcó lista. |
| `importe_centimos` | entero derivado | `cantidad × precio_centimos`. |

**Reglas**:
- El precio no cambia si cambia la carta (FR-002).
- Todas las líneas de la mesa se incluyen en el total, tengan estado `pendiente` o `listo`.
- Una línea de un pedido `enviada` con `estado = pendiente` bloquea el cierre y se muestra al
  camarero (FR-019).
- Las líneas de un pedido `en_curso` no se consideran pendientes de cocina, porque aún no se
  han enviado.

### Cuenta (propiedad de esta historia 006)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador único. |
| `mesa_id` | texto | Mesa de la cuenta. |
| `pedido_id` | texto / nulo | Pedido de la comanda que origina la cuenta; permite separar cuentas históricas de una mesa reutilizada. |
| `estado` | enumerado | `abierta` (división confirmada) \| `cerrada`. |
| `total_centimos` | entero | Total de consumos, IVA incluido. |
| `modo_division` | enumerado / nulo | `unico` \| `iguales` \| `por_consumo`. |
| `abierta_en` | fecha | Creación de la cuenta persistida. |
| `cerrada_en` | fecha / nulo | Cierre de la cuenta. |
| `camarero_id` | texto / nulo | Camarero que realizó el cobro, cuando se persiste. |

**Reglas**:
- La cuenta se asocia al pedido de la comanda (`pedido_id`). La consulta de la cuenta actual usa el
  pedido activo de la mesa; una cuenta cerrada de un pedido anterior no bloquea una comanda nueva.
- Sin división, la cuenta abierta es derivada de los consumos y no se persiste hasta el cobro.
- Al confirmar una división se persiste la cuenta en estado `abierta`, con sus partes pendientes.
- La cuenta pasa a `cerrada` una sola vez, en la transacción que completa el pago único o la
  última parte pendiente.
- No se puede cerrar mientras haya líneas pendientes de pedidos enviados; se devuelve
  `409 platos_pendientes` con la lista de líneas.
- Cada mesa puede tener varias cuentas cerradas históricas y, como máximo, una cuenta abierta
  persistida en cobro.
- La cuenta cerrada no se reabre; una nueva comanda crea una cuenta nueva.

### Parte de la cuenta (propiedad de esta historia 006)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador único. |
| `cuenta_id` | texto | Cuenta a la que pertenece. |
| `orden` | entero | Posición 1..n; determina el reparto de céntimos. |
| `comensal` | texto | Etiqueta del comensal. |
| `importe_centimos` | entero | Importe de la parte. |
| `estado` | enumerado | `pendiente` \| `pagada`. |
| `pagada_en` | fecha / nulo | Momento del pago. |

**Reglas**:
- La suma de las partes es exactamente `cuenta.total_centimos`.
- En partes iguales, el sobrante se reparte de uno en uno por orden.
- La cuenta se cierra solo cuando todas las partes están pagadas y no hay platos pendientes de
  cocina.
- Una parte pagada puede volver a pendiente mientras la cuenta esté abierta.
- Al marcar la última parte como pagada se cierra la cuenta, se libera la mesa y se emite el
  ticket único; si hay platos pendientes, la operación se rechaza.

### Asignación de consumo (propiedad de esta historia 006)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | texto | Identificador de la asignación. |
| `parte_id` | texto | Parte de la cuenta. |
| `linea_id` | texto | Consumo asignado. |
| `importe_centimos` | entero | Porción del consumo asignada a la parte. |

**Reglas**:
- La suma de asignaciones de cada consumo es su importe.
- La suma de asignaciones de cada parte es su importe.
- Permite repartir un plato compartido entre varias partes.

### Ticket (modelo derivado, no persistido)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `estado` | enumerado | `no_emitido` \| `emitido`. |
| `mesa_id` | texto | Mesa de la cuenta cerrada. |
| `total_centimos` | entero | Total de la cuenta. |
| `generado_en` | fecha | `cuenta.cerrada_en`. |
| `partes` | lista | Desglose de partes; vacío en pago único. |

**Reglas**:
- `no_emitido` mientras la cuenta está abierta.
- `emitido` solo cuando la cuenta se cierra; se emite una sola vez.
- Al liberar la mesa y abrir una comanda nueva, el ticket histórico no se modifica.

## Relaciones

```text
Mesa 1 ─── N Pedido
Mesa 1 ─── N Cuenta (histórico)
Pedido 1 ─ N Consumo
Cuenta 1 ─ N Parte
Cuenta 1 ─ N Asignación
Parte 1 ── N Asignación
Consumo 1 ─ N Asignación
```

## Validaciones y cálculos

1. **Total**: suma de `cantidad × precio_centimos` de todas las líneas de pedidos `en_curso` y
   `enviada`.
2. **Partes iguales**: base y resto según reparto determinista.
3. **Por consumo**: cada consumo queda cubierto exactamente y cada parte coincide con sus
   asignaciones.
4. **Bloqueo de cocina**: si existe alguna línea `pendiente` en un pedido `enviada` de la mesa,
   no se permite cerrar la cuenta ni pagar la última parte.
5. **Cierre**: cuenta pasa a `cerrada`, mesa a `libre`, se emite ticket y `mesa-cerrada` en la
   misma transacción.
6. **Reutilización**: la mesa liberada puede abrir una nueva comanda; la cuenta anterior queda
   cerrada y no se reabre.
7. **Ticket**: un único ticket al cerrar; consultable después.

## Transiciones de estado

```text
Mesa:      libre ──(abrir)──▶ ocupada ──(cerrar cuenta)──▶ libre
Cuenta:    derivada/abierta ──(pago único o última parte)──▶ cerrada
Parte:     pendiente ──(pagar)──▶ pagada ──(deshacer; cuenta abierta)──▶ pendiente
Ticket:    no_emitido ──(cerrar cuenta)──▶ emitido
```
