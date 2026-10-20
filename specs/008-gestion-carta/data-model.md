# Modelo de datos (Fase 1): Gestión de la carta

La funcionalidad gestiona el catálogo de platos y el estado de los ingredientes. La disponibilidad
ofrecida de un plato **no se persiste**: se deriva al leer (regla combinada). Los platos nunca se
borran: se desactivan para preservar el historial de ventas.

## Entidades persistidas

### Plato
Elemento de la carta que el administrador gestiona y que la sala puede pedir.
- `id`: identificador único.
- `nombre`: nombre mostrado (texto no vacío).
- `partida`: `entrantes` | `principales` | `postres` (enumerado fijo, FR-013).
- `precio`: número en euros, estrictamente mayor que cero (FR-004).
- `activo`: booleano; disponibilidad **manual** marcada por el administrador (FR-005). Por defecto
  `true` al crear.

**Reglas de validación**:
- `nombre` no vacío; `partida` debe ser uno de los valores fijos; `precio > 0`.
- Se permiten nombres duplicados si la identidad es distinta: la identidad es el `id`, no el nombre
  (caso límite).
- No se elimina nunca: la baja es `activo = false` (FR-014, preserva ventas).

### Ingrediente
Componente de uno o varios platos con un estado registrado por el administrador. El administrador
puede crearlo, editarlo y cambiar su estado desde la gestión de la carta (FR-015).
- `id`: identificador único.
- `nombre`: nombre mostrado (texto no vacío).
- `estado`: `disponible` | `agotado` (FR-007/FR-008); por defecto `disponible` al crear.

**Reglas de validación**:
- `nombre` no vacío.
- `estado` debe ser uno de los valores permitidos; cualquier otro valor se rechaza con un aviso.
- Esta historia solo define alta y edición; no se elimina ningún ingrediente (FR-015).

### PlatoIngrediente (relación)
Asociación N:M entre platos e ingredientes, gestionada desde la administración de la carta.
- `platoId`: referencia a `Plato`.
- `ingredienteId`: referencia a `Ingrediente`.

**Reglas**:
- Un plato puede no tener ingredientes (caso límite: su disponibilidad depende solo de `activo`).
- Un ingrediente puede asociarse a uno o varios platos (caso límite del ingrediente compartido).
- Solo se asocian ingredientes existentes; una referencia desconocida se rechaza con un aviso
  (FR-015).
- El par (`platoId`, `ingredienteId`) es único: no se duplica una asociación.
- La asociación se envía como conjunto completo de `ingredienteIds` al crear o editar el plato y
  sustituye a la anterior.
- Un plato con varios ingredientes se oculta si **cualquiera** de ellos está agotado (FR-007,
  escenario 3 de la US3).

## Modelos derivados (no persistidos)

### DisponibilidadPlato
Resultado del cálculo de oferta para un plato en un momento dado.
- `ofrecible`: `plato.activo AND (todos los ingredientes asociados están disponibles)` (FR-012).
  Si no hay ingredientes asociados, la condición de ingredientes se cumple.
- `motivo`: `activo` | `inactivo` | `ingrediente_agotado` (para la vista de gestión; no altera la
  regla).

**Regla de cálculo**: se evalúa en cada lectura; no se guarda ni se sincroniza (D1 de
`research.md`). Un cambio de `activo`, de la asociación o del `estado` de un ingrediente se refleja
en la siguiente consulta (FR-009/FR-010/FR-015, SC-002, SC-006).

### CartaVigente
Vista de solo lectura que consumen las tabletas de sala.
- Agrupa por `partida` (entrantes, principales, postres) los platos con `ofrecible = true`.
- Incluye `id`, `nombre`, `precio` de cada plato ofrecible.
- No incluye platos ocultos (por baja manual o por ingrediente agotado) (FR-006).

## Relaciones

```text
Plato * ── * Ingrediente        (vía PlatoIngrediente)
   │
   └── partida (enum fijo)

DisponibilidadPlato = Plato.activo AND NOT EXISTS ingrediente asociado con estado = agotado
                     (verdadero si el plato no tiene ingredientes)
CartaVigente = { platos : DisponibilidadPlato.ofrecible = true } agrupados por partida
```

## Transiciones de estado

- **Plato.activo**: `true → false` (baja manual) y `false → true` (reactivación manual). La baja
  automática no cambia `activo`; cambia el `estado` del ingrediente (FR-005, FR-008).
- **Ingrediente.estado**: `disponible → agotado` (baja automática de todos los platos que lo usan)
  y `agotado → disponible` (los platos vuelven **solo si** `activo = true`, regla combinada FR-012,
  escenario 4 de la US3). El cambio de estado no modifica `activo`.
- **Ingrediente**: alta con `nombre` y `estado` (por defecto `disponible`) y edición posterior de
  ambos; no se borra (FR-015).
- **Asociación Plato–Ingrediente**: puede añadirse o retirarse en cualquier momento desde la edición
  del plato; al retirar el último ingrediente, la disponibilidad vuelve a depender solo de `activo`
  (FR-015).
- **Precio del plato**: puede cambiar en cualquier momento; no afecta a líneas de pedido ya
  tomadas ni a cuentas del pasado (FR-014). El precio fijado al pedir pertenece a la historia 01.
