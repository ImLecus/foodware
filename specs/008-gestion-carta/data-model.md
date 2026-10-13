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
Componente de uno o varios platos con un estado registrado por el administrador.
- `id`: identificador único.
- `nombre`: nombre mostrado.
- `estado`: `disponible` | `agotado` (FR-007/FR-008).

**Reglas de validación**: `estado` debe ser uno de los valores permitidos.

### PlatoIngrediente (relación)
Asociación N:M entre platos e ingredientes.
- `platoId`: referencia a `Plato`.
- `ingredienteId`: referencia a `Ingrediente`.

**Reglas**: un plato puede no tener ingredientes (caso límite: su disponibilidad depende solo de
`activo`); un plato con varios ingredientes se oculta si **cualquiera** de ellos está agotado
(FR-007, escenario 3 de la US3).

## Modelos derivados (no persistidos)

### DisponibilidadPlato
Resultado del cálculo de oferta para un plato en un momento dado.
- `ofrecible`: `plato.activo AND (no hay ingredientes agotados entre los asociados)` (FR-012).
- `motivo`: `activo` | `inactivo` | `ingrediente_agotado` (para la vista de gestión; no altera la
  regla).

**Regla de cálculo**: se evalúa en cada lectura; no se guarda ni se sincroniza (D1 de
`research.md`). Un cambio de `activo` o del `estado` de un ingrediente se refleja en la siguiente
consulta (FR-009/FR-010, SC-002).

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
CartaVigente = { platos : DisponibilidadPlato.ofrecible = true } agrupados por partida
```

## Transiciones de estado

- **Plato.activo**: `true → false` (baja manual) y `false → true` (reactivación manual). La baja
  automática no cambia `activo`; cambia el `estado` del ingrediente (FR-005, FR-008).
- **Ingrediente.estado**: `disponible → agotado` (baja automática de los platos que lo usan) y
  `agotado → disponible` (los platos vuelven **solo si** `activo = true`, regla combinada FR-012,
  escenario 4 de la US3).
- **Precio del plato**: puede cambiar en cualquier momento; no afecta a líneas de comanda ya
  tomadas ni a cuentas del pasado (FR-014). El precio fijado al pedir pertenece a la historia 01.
