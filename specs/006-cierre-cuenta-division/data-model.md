# Phase 1 — Data Model: Cierre y división de cuenta

Este documento describe las entidades que la historia 006 necesita. La historia **lee** las
mesas y las líneas de pedido de las historias 01–04, **escribe** la cuenta, sus partes y las
asignaciones de consumo, y **cierra** la mesa. La cuenta se persiste en estado abierto al
confirmarse una división (para conservar el pago de cada parte entre peticiones) y pasa a
cerrada al pagarse la última parte; el ticket es un modelo derivado con estado
`no emitido`/`emitido` (no persistido).

## Entidades

### Mesa (propiedad de la historia 01; aquí solo lectura + cierre)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la mesa |
| `numero` | texto | Identificador visible de la mesa en sala (p. ej. "12") |
| `abierta` | booleano | `true` mientras la mesa está en servicio |

**Reglas**:
- Solo se puede cerrar la cuenta de una mesa con `abierta = true` (FR-001).
- La historia 006 marca `abierta = false` en la misma transacción en que se paga la última
  parte pendiente de una cuenta dividida (o se confirma el pago único) (FR-011, FR-012); la
  apertura de la mesa es de la historia 01 y no se reabre en v1.

### Consumo (línea de pedido; propiedad de las historias 01–04; aquí solo lectura)

Cada plato anotado en el pedido de la mesa, con el precio fijado en el momento de pedirlo.

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

Importe total de lo consumido por una mesa y su estado. Sin división, la **cuenta abierta**
es derivada (se calcula desde los consumos mientras la mesa está abierta) y solo se persiste
al confirmar el pago único. Al confirmar una **división**, la cuenta se persiste en estado
`abierta` con sus partes pendientes para conservar los pagos y sus reversiones entre
peticiones; pasa a `cerrada` al pagarse la última parte.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la cuenta |
| `mesa_id` | entero | Mesa a la que pertenece (relación N:1 con Mesa) |
| `estado` | enumerado | `abierta` \| `cerrada`; `abierta` se persiste al confirmar una división |
| `total_cent` | entero | Importe total, en céntimos (IVA incluido); es el total base de la división |
| `modo_division` | enumerado / nulo | `unico` \| `iguales` \| `por_consumo` |
| `creada_en` | marca de tiempo | Momento de creación del registro |
| `cerrada_en` | marca de tiempo / nulo | Momento del cierre; nulo mientras está abierta |

**Reglas**:
- Existe como máximo **una cuenta cerrada vigente por mesa** y como máximo **una cuenta
  abierta persistida en cobro** (con división confirmada); cerrar una cuenta ya cerrada se
  rechaza (FR-014).
- Mientras la cuenta persistida está `abierta`, su `total_cent` es el **total base** de la
  división. Si al pagar o revertir una parte el total actual de los consumos difiere, se
  rechaza la operación (`422`), se descarta la división y el camarero debe rehacerla (FR-017).
- `modo_division = unico` significa un solo pago, sin partes (FR-005, suposición).
- La cuenta pasa a `cerrada` una sola vez, en la transacción que completa el pago (pago único
  o última parte pendiente); no se reabre en v1.

### Parte de la cuenta (propiedad de esta historia 006)

Cada porción de la división, con su importe, el comensal asociado y su estado de pago.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la parte |
| `cuenta_id` | entero | Cuenta a la que pertenece (relación N:1 con Cuenta) |
| `orden` | entero | Posición de la parte (1..n); determina el reparto de céntimos (FR-018) |
| `comensal` | texto / nulo | Etiqueta del comensal al que se asocia la parte (FR-008) |
| `importe_cent` | entero | Importe de la parte, en céntimos |
| `estado` | enumerado | `pendiente` \| `pagada`; toda parte nace `pendiente` |
| `pagada_en` | marca de tiempo / nulo | Momento en que se marcó como pagada; nulo si está pendiente |

**Reglas**:
- La suma de `importe_cent` de todas las partes es exactamente `cuenta.total_cent` (FR-009).
- En partes iguales, la parte con `orden ≤ resto` recibe un céntimo más (FR-018).
- La mesa se cierra solo cuando todas las partes tienen `estado = pagada` (FR-016).
- Al marcar la **última** parte pendiente como pagada se cierra la cuenta y la mesa en la
  misma transacción y se emite el único ticket (FR-010, SC-008).
- Una parte `pagada` puede volver a `pendiente` mientras la mesa no esté cerrada; al revertir
  se limpia `pagada_en`. Si la mesa ya está cerrada, la reversión se rechaza (FR-016, SC-009).
- Una parte `pagada` no se puede volver a marcar como pagada; una parte `pendiente` no se
  puede desmarcar.

### Asignación de consumo (propiedad de esta historia 006)

Reparto de un consumo (o de una porción de su importe) a una parte, en la división por
consumo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | entero | Identificador único de la asignación |
| `cuenta_id` | entero | Cuenta a la que pertenece (FK) |
| `parte_id` | entero | Parte de la división a la que se asigna (FK) |
| `consumo_id` | entero | Consumo (línea de pedido) asignado (FK, solo lectura) |
| `importe_cent` | entero | Porción del importe del consumo asignada a la parte |

**Reglas**:
- Para cada consumo, la suma de sus asignaciones es igual a su `importe_cent` (todo lo
  consumido queda repartido).
- Permite repartir un plato compartido entre varias partes (edge case).

### División de la cuenta (modelo, no persistido como entidad propia)

Conjunto de partes en que se reparte el importe, con su modo (`iguales` o `por_consumo`) y, en
el modo por consumo, las asignaciones de consumos o porciones. Se persiste en
`cuentas_partes` y `cuentas_parte_consumos` al confirmar la división, con todas las partes en
estado `pendiente`; no se persiste como entidad propia. Mientras ninguna parte esté pagada, la
división puede sustituirse por otra (cancelar y rehacer sin cobrar); con alguna parte pagada,
solo se descarta si la cuenta cambia (FR-017).

### Ticket (modelo derivado, no persistido)

Documento final compuesto a partir de la cuenta cerrada y sus partes: el total y el desglose
de cada parte con su importe. No se persiste una tabla propia; su **estado** se deriva de la
cuenta: `no_emitido` mientras la cuenta está abierta (aunque haya partes ya pagadas) y
`emitido` cuando la cuenta se cierra. Se emite **una sola vez**, al pagarse la última parte
pendiente de una cuenta dividida o al confirmar el pago único; no existen tickets
provisionales por partes intermedias (FR-010, SC-008). `generadoEn` coincide con
`cuenta.cerrada_en`. Una vez emitido, puede volver a mostrarse desde la cuenta cerrada.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `estado` | enumerado (derivado) | `no_emitido` \| `emitido` |
| `totalCent` | entero | Total de la cuenta cerrada |
| `partes` | lista | Desglose de cada parte con su importe (vacío en modo único) |
| `generadoEn` | marca de tiempo | Momento del cierre; nulo si `estado = no_emitido` |

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
5. **Cierre**: se cierra en la misma transacción que marca la última parte pendiente como
   pagada (o al confirmar el pago único), solo si el total actual coincide con el total base,
   ninguna parte queda pendiente y la cuenta no estaba cerrada (FR-011, FR-014, FR-016).
   No existe una operación de cierre separada para cuentas divididas.
6. **Emisión del ticket**: se emite exactamente una vez al cerrar la cuenta; antes de ese
   momento `estado = no_emitido` y la consulta del ticket se rechaza (FR-010, SC-008).
7. **Reversión**: una parte pagada vuelve a pendiente solo con la mesa abierta; la operación
   limpia `pagada_en` y no emite ni invalida ningún ticket, porque todavía no existe
   (FR-016, SC-009).
8. **Mesa sin consumos**: la cuenta muestra un total de cero y **no** permite un cierre sin
   importe (edge case).

## Transiciones de estado

```text
Cuenta
  derivada (sin división) / abierta persistida (división confirmada)
        ──(pago único o última parte pendiente)──▶ cerrada (persistida)

Parte de la cuenta
  pendiente ──(camarero marca como pagada)──▶ pagada
  pagada ──(camarero deshace la marca; mesa abierta)──▶ pendiente
  (no se admite pagar una parte ya pagada ni desmarcar una pendiente)

Ticket
  no_emitido ──(se cierra la cuenta: pago único o última parte)──▶ emitido
  (no hay vuelta atrás: la mesa ya está cerrada)

Mesa
  abierta ──(pago único o última parte pendiente)──▶ cerrada
  (no se reabre en v1; las nuevas operaciones se rechazan)
```
