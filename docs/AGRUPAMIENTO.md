# Agrupamiento del proyecto: 4 personas × 2 historias

Sistema de comandas para restaurante (**Foodware**). La base común (autenticación y
roles) se identifica como `000` y la asume la persona que también coordina las dos
historias de cocina.

| Persona              | Historias       | Spec                                                                                                                                    | Tema                                              |
| -------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Israel Izquierdo** | 000 + 003 + 004 | [000](../specs/000-esqueleto-autenticacion/spec.md), [003](../specs/003-ver_pedidos/spec.md), [004](../specs/004-marcar_listos/spec.md) | Base común, cocina y pedidos                      |
| **Marcos González**  | 001 + 002       | [001](../specs/001-comandas/spec.md), [002](../specs/002-editar-comanda/spec.md)                                                        | Comandas: tomar y editar pedidos                  |
| **Daniel Alarcón**   | 005 + 006       | [005](../specs/005-senales-platos-listos/spec.md), [006](../specs/006-cierre-cuenta-division/spec.md)                                   | Sala: señales de platos listos y cierre de cuenta |
| **Danil Launov**     | 007 + 008       | [007](../specs/007-dashboard-estadisticas/spec.md), [008](../specs/008-gestion-carta/spec.md)                                           | Dirección: dashboard y gestión de la carta        |

## Por qué así

- **Israel (000 + 003 + 004)**: la autenticación y los roles son la base de todas las
  historias; cocina (003) y el marcado de platos listos (004) comparten el modelo de
  pedidos y líneas.
- **Marcos (001 + 002)**: tomar una comanda y editarla son las dos caras del mismo
  flujo; conviene que las lleve una sola persona para no duplicar reglas.
- **Daniel (005 + 006)**: las señales de platos listos y el cierre de cuenta giran en
  torno a la mesa y al consumo; ambas son pantallas de sala.
- **Danil (007 + 008)**: el dashboard consume las cuentas cerradas y la carta; la
  gestión de la carta es la fuente de datos que alimenta tanto la sala como los
  informes.

## Dependencias entre personas

- **000** (Israel) define usuarios, roles y sesión; el resto lo reutiliza.
- **001/002** (Marcos) generan pedidos y líneas que consumen **003/004** (Israel) y
  **005/006** (Daniel).
- **006** (Daniel) genera las cuentas cerradas que consume **007** (Danil).
- **008** (Danil) modifica la carta que leen **001** (Marcos) y **007** (Danil).

## Acuerdos comunes antes de empezar

1. **Roles**: `camarero`, `cocinero`, `encargado`, `administrador`.
2. **Importes** en céntimos enteros; formato de euro en la interfaz.
3. **Fechas** en UTC con formato SQLite (`YYYY-MM-DD HH:MM:SS`).
4. **Textos** en español de España.
5. **Persistencia**: SQLite con migraciones versionadas; no se modifica
   `001_init.sql` una vez compartido.
6. **Tiempo real**: eventos SSE publicados por el hub compartido.

## Orden sugerido

Orden basado en las dependencias reales entre historias, no en semanas concretas. Los
bloques pueden solaparse si no hay conflicto de archivos.

1. **000 — Base común** (Israel): usuarios, roles, sesión y modelo inicial. Es requisito
   de todas las demás.
2. **008 — Gestión de la carta** (Danil): alimenta la carta que consumen 001 y 007.
3. **001 + 002 — Comandas** (Marcos): generan los pedidos y líneas que usan cocina y sala.
4. **003 + 004 — Cocina** (Israel): consumen los pedidos de 001/002.
5. **005 + 006 — Señales y cuenta** (Daniel): consumen pedidos de 001/002 y producen las
   cuentas cerradas.
6. **007 — Dashboard** (Danil): consume las cuentas cerradas de 006 y la carta de 008.
