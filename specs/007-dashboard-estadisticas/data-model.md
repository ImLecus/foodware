# Modelo de datos (Fase 1): Dashboard de estadísticas del servicio

Esta funcionalidad es de **solo lectura**. La mayoría de entidades pertenecen a otras historias y
aquí se consumen como dependencia; solo se introducen modelos derivados (no persistidos) para
construir el informe. El dashboard nunca escribe sobre cuentas, consumos, camareros ni platos.

## Entidades consumidas (solo lectura)

### Cuenta (cerrada)
Unidad de venta de una mesa. Solo se cuentan las cuentas en estado *cerrada*.
- `id`: identificador único.
- `mesaId`: mesa cobrada.
- `camareroId`: camarero que la cerró (clave del desglose por camarero).
- `estado`: `abierta` | `cerrada` (solo se agregan las `cerrada`).
- `fechaCierre`: fecha y hora de cierre (define a qué día natural pertenece la venta).
- `importeTotal`: total cobrado, con los precios fijados al pedir.
- `estaDividida`: indica si la cuenta se repartió en partes (no altera el total agregado).

**Regla de validación/cálculo**: una cuenta cuenta como venta del día si y solo si su
`fechaCierre` cae en el día natural consultado (Europe/Madrid) y su estado es `cerrada`.

### Consumo (línea de la cuenta)
Cada plato cobrado dentro de una cuenta; base del desglose por plato.
- `cuentaId`: cuenta a la que pertenece.
- `platoId`: plato vendido (clave del desglose por plato).
- `cantidad`: unidades vendidas (entero ≥ 1).
- `precioUnitario`: precio fijado en el momento de pedir (no el precio actual de la carta).
- `partida`: entrantes | principales | postres.

**Regla de validación/cálculo**: el importe de una línea es `cantidad × precioUnitario`; la suma de
líneas de una cuenta coincide con su `importeTotal`.

### Camarero (perfil de usuario)
- `id`: identificador único.
- `nombre`: nombre mostrado en el desglose.
- `rol`: incluye `encargado` (acceso al dashboard) y `camarero`.

### Plato
- `id`: identificador único.
- `nombre`: nombre mostrado en el desglose.
- `partida`: entrantes | principales | postres.

## Modelos derivados (no persistidos)

### InformeDiario
Resultado completo que devuelve el endpoint para un día natural.
- `fecha`: día consultado (`YYYY-MM-DD`, Europe/Madrid).
- `totalVendido`: suma de `importeTotal` de las cuentas cerradas del día (≥ 0).
- `numeroCuentas`: número de cuentas cerradas del día.
- `porCamarero`: lista de `DesgloseCamarero`.
- `porPlato`: lista de `DesglosePlato`.
- `comparacion`: `ComparacionDia`.

### DesgloseCamarero
- `camareroId`, `nombre`.
- `importe`: total facturado por ese camarero en el día (0,00 € si no vendió).
- `numeroCuentas`: cuentas cerradas por ese camarero.

### DesglosePlato
- `platoId`, `nombre`, `partida`.
- `cantidad`: unidades vendidas del plato en el día (0 si no se vendió).
- `importe`: importe facturado del plato en el día (0,00 € si no se vendió).

**Regla de presentación**: los desgloses incluyen a todos los camareros y platos con al menos una
venta histórica relevante, mostrando `0,00 €` cuando no tuvieron ventas en el día (FR-003/FR-004 y
escenario 3 de la US2), en lugar de omitirlos.

### ComparacionDia
- `diaActual`: `YYYY-MM-DD`.
- `diaAnterior`: `YYYY-MM-DD` o `null` si no existe día anterior con datos.
- `importeActual`, `importeAnterior`.
- `diferenciaImporte`: `importeActual − importeAnterior`.
- `diferenciaPorcentaje`: variación relativa (puede ser `null` si el importe anterior es 0).
- `tendencia`: `subida` | `bajada` | `sin_variacion`.
- `porCamarero` y `porPlato`: diferencia del día actual frente al anterior en cada desglose
  (FR-010), con la misma forma que los desgloses del informe.

**Regla de tendencia**: `sin_variacion` cuando `diferenciaImporte = 0`; `subida` si > 0; `bajada`
si < 0. Si no hay día anterior, se indica "sin datos anteriores" (FR-007).

## Relaciones

```text
Cuenta (cerrada) 1 ── * Consumo * ── 1 Plato
   │                                  │
   └── 1 Camarero (fechaCierre)       └── partida

InformeDiario ── 1 ComparacionDia ── * DesgloseCamarero / DesglosePlato
```

## Transiciones de estado

- **Cuenta**: `abierta → cerrada`. El dashboard solo computa el estado `cerrada`; una cuenta que
  se cierra suma al día de su `fechaCierre`. No hay transición inversa (no se reabre en v1).
- **InformeDiario / ComparacionDia**: se calculan en cada consulta a partir del estado actual de
  las cuentas (no tienen estado propio ni persistencia).
