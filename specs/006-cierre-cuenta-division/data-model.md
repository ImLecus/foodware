# Phase 1 — Data Model: Cierre y división de cuenta

Este documento describe las entidades que la historia 006 necesita. La historia **lee** las
mesas y las líneas de comanda de las historias 01–04, **escribe** la cuenta cerrada, sus
partes y las asignaciones de consumo, y **cierra** la mesa. El ticket es un modelo derivado
(no persistido).

## Entidades

### Mesa (propiedad de la historia 01; aquí solo lectura + cierre)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la mesa |
| `numero` | texto | Identificador visible de la mesa en sala (p. ej. "12") |
| `abierta` | booleano | `true` mientras la mesa está en servicio |

**Reglas**:
- Solo se puede cerrar la cuenta de una mesa con `abierta = true` (FR-001).
- Al confirmar el cobro, la historia 006 marca `abierta = false` (FR-011, FR-012); la
  apertura de la mesa es de la historia 01 y no se reabre en v1.

### Consumo (línea de comanda; propiedad de las historias 01–04; aquí solo lectura)

Cada plato anotado en la comanda de la mesa, con el precio fijado en el momento de pedirlo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la línea |
| `mesa_id` | entero | Mesa a la que pertenece (relación N:1 con Mesa) |
| `nombre` | texto | Nombre del plato |
| `cantidad` | entero | Unidades de la línea (≥ 1) |
| `partida` | enumerado | `entrantes` \| `principales` \| `postres` |
| `precio_unitario_cent` | entero | Precio unitario **fijado al pedir**, en céntimos (IVA incluido) |
| `importe_cent` | entero (derivado) | `cantidad × precio_unitario_cent` |

**Reglas**:
- El precio no cambia aunque cambie la carta; un cambio de precio no altera cuentas en curso
  (FR-002, clarificación).
- El importe se calcula en céntimos enteros.

### Cuenta (propiedad de esta historia 006)

Importe total de lo consumido por una mesa y su estado. La **cuenta abierta** es derivada
(se calcula desde los consumos mientras la mesa está abierta); la **cuenta cerrada** se
persiste al confirmar el cobro.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la cuenta |
| `mesa_id` | entero | Mesa a la que pertenece (relación N:1 con Mesa) |
| `estado` | enumerado | `abierta` \| `cerrada` (en v1 se persiste solo `cerrada`) |
| `total_cent` | entero | Importe total, en céntimos (IVA incluido) |
| `modo_division` | enumerado / nulo | `unico` \| `iguales` \| `por_consumo` |
| `creada_en` | marca de tiempo | Momento de creación del registro |
| `cerrada_en` | marca de tiempo / nulo | Momento del cierre; nulo mientras está abierta |

**Reglas**:
- Existe como máximo **una cuenta cerrada vigente por mesa**; cerrar una cuenta ya cerrada se
  rechaza (FR-014).
- `modo_division = unico` significa un solo pago, sin partes (FR-005, suposición).

### Parte de la cuenta (propiedad de esta historia 006)

Cada porción de la división, con su importe, el comensal asociado y su estado de pago.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la parte |
| `cuenta_id` | entero | Cuenta a la que pertenece (relación N:1 con Cuenta) |
| `orden` | entero | Posición de la parte (1..n); determina el reparto de céntimos (FR-018) |
| `comensal` | texto / nulo | Etiqueta del comensal al que se asocia la parte (FR-008) |
| `importe_cent` | entero | Importe de la parte, en céntimos |
| `pagada` | booleano | `true` cuando la parte se ha cobrado |
| `pagada_en` | marca de tiempo / nulo | Momento en que se marcó como pagada |

**Reglas**:
- La suma de `importe_cent` de todas las partes es exactamente `cuenta.total_cent` (FR-009).
- En partes iguales, la parte con `orden ≤ resto` recibe un céntimo más (FR-018).
- La mesa se cierra solo cuando todas las partes tienen `pagada = true` (FR-016).

### Asignación de consumo (propiedad de esta historia 006)

Reparto de un consumo (o de una porción de su importe) a una parte, en la división por
consumo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la asignación |
| `cuenta_id` | entero | Cuenta a la que pertenece (FK) |
| `parte_id` | entero | Parte de la división a la que se asigna (FK) |
| `consumo_id` | entero | Consumo (línea de comanda) asignado (FK, solo lectura) |
| `importe_cent` | entero | Porción del importe del consumo asignada a la parte |

**Reglas**:
- Para cada consumo, la suma de sus asignaciones es igual a su `importe_cent` (todo lo
  consumido queda repartido).
- Permite repartir un plato compartido entre varias partes (edge case).

### División de la cuenta (modelo, no persistido como entidad propia)

Conjunto de partes en que se reparte el importe, con su modo (`iguales` o `por_consumo`) y, en
el modo por consumo, las asignaciones de consumos o porciones.

### Ticket (modelo derivado, no persistido)

Documento final compuesto a partir de la cuenta cerrada y sus partes: el total y el desglose
de cada parte con su importe. No se persiste una tabla propia; se compone al confirmar el
cierre y puede volver a mostrarse desde la cuenta cerrada (FR-010).

## Relaciones

```text
Mesa   1 ──── N Consumo                 (una mesa agrupa varios consumos)
Mesa   1 ──── N Cuenta                  (histórico; como máximo 1 cerrada vigente)
Cuenta 1 ──── N Parte de la cuenta      (una cuenta puede dividirse en varias partes)
Cuenta 1 ──── N Asignación de consumo   (solo en modo por consumo)
Parte  1 ──── N Asignación de consumo
Consumo 1 ── N Asignación de consumo    (un consumo puede repartirse en porciones)
```

## Reglas de validación y cálculo

1. **Total de la cuenta**: `total_cent = Σ consumo.importe_cent` (cantidad × precio unitario
   fijado al pedir), en céntimos.
2. **Partes iguales**: `base = total_cent ÷ n` y `resto = total_cent − base × n`; las partes
   con `orden ≤ resto` reciben `base + 1`, el resto `base`.
3. **División por consumo**: la suma de asignaciones de cada consumo es su importe y la suma
   de todas las asignaciones es `total_cent`.
4. **Coincidencia exacta**: `Σ parte.importe_cent = cuenta.total_cent` siempre (FR-009).
5. **Cierre**: solo se cierra si el total coincide con el total base de la división (FR-017),
   ninguna parte queda pendiente (FR-016) y la cuenta no estaba cerrada (FR-014).
6. **Mesa sin consumos**: la cuenta muestra un total de cero y **no** permite un cierre sin
   importe (edge case).

## Transiciones de estado

```text
Cuenta (abierta)
  derivada mientras la mesa está abierta (no persistida)
        ──(camarero confirma el cobro)──▶ Cuenta (cerrada, persistida)

Parte de la cuenta
  pendiente ──(camarero marca como pagada)──▶ pagada
  (no se admite volver a pendiente; el cierre se hace con todas pagadas)

Mesa
  abierta ──(cierre de cuenta confirmado)──▶ cerrada
  (no se reabre en v1; las nuevas operaciones se rechazan)
```
