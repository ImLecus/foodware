# Contrato: Interfaz del dashboard (`dashboard-ui`)

Contrato de comportamiento de la página `/dashboard` (React + Chakra UI). Define estados,
contenido mínimo y reglas de presentación verificables por una persona no técnica.

## Acceso

- Solo visible para el rol **encargado**. Si un usuario sin ese rol intenta acceder, no ve la
  entrada de navegación y la ruta responde con un estado "sin permiso".
- La página consulta `GET /api/reports/daily` (ver `reports-api.md`).

## Estados de la página

| Estado | Cuándo | Qué muestra |
|--------|--------|-------------|
| Cargando | Mientras se resuelve la petición | Indicador de carga (spinner Chakra UI) |
| Datos | Respuesta 200 con ventas | Total del día, tabla por camarero, tabla por plato y bloque de comparación |
| Vacío | Respuesta 200 con `totalVendido = 0` y sin cuentas | Total `0,00 €`, mensaje de "no hay ventas registradas para este día" y desgloses con todas las filas a `0,00 €` |
| Sin datos anteriores | `comparacion.diaAnterior = null` | Mensaje "sin datos anteriores para comparar" en el bloque de comparación |
| Sin base de comparación | `comparacion.sinBaseComparacion = true` | Diferencia en euros y etiqueta «sin base de comparación»; no se muestra porcentaje |
| Error de red | Fallo de red (sin respuesta HTTP) | Mensaje «sin conexión», conservando la última vista cargada si existía |
| Error del servidor | `400`/`500` con respuesta HTTP | Mensaje de error del servidor; nunca etiquetarlo como «sin conexión» |
| Sin permiso | 401/403 | Mensaje de acceso restringido al encargado |

## Contenido obligatorio (estado "Datos")

1. **Total del día**: cifra en euros, en primer plano (SC-001), acompañada siempre de la **fecha
   visible** del día natural mostrado en formato español (`13/10/2026`), para no confundirla con el
   día en curso (FR-012).
2. **Desglose por camarero**: tabla con nombre, número de cuentas e importe (FR-003), con todos los
   camareros activos, incluidos los que no vendieron (`0,00 €`), y con cualquier camarero que
   vendiera ese día aunque ya no esté activo.
3. **Desglose por plato**: tabla con nombre, partida, cantidad e importe (FR-004), con todos los
   platos de la carta vigente, incluidos los no vendidos (`0,00 €`, `0` unidades), y con cualquier
   plato vendido ese día aunque ya no esté en la carta.
4. **Orden de las tablas**: por importe descendente y, a igualdad, por nombre alfabético (FR-013).
5. **Comparación con el día anterior** (FR-005, FR-006, FR-010, FR-011):
   - Importe del día actual frente al anterior.
   - Diferencia en importe y porcentaje; si `sinBaseComparacion = true`, se muestra la diferencia
     en euros con la etiqueta «sin base de comparación» y **no** se muestra porcentaje.
   - Indicador de tendencia con icono + color + texto: "subida" (verde), "bajada" (rojo),
     "sin variación" (neutro).
   - Diferencias por camarero y por plato, aplicando **la misma regla de base cero fila a fila**:
     una fila sin ventas el día anterior y con ventas hoy muestra la diferencia en euros con
     «sin base de comparación» y sin porcentaje (FR-011).

## Reglas de presentación

- Todos los importes en euros con formato `es-ES` (`1.287,50 €`).
- Las fechas se muestran con formato `es-ES` (`13/10/2026`); la fecha del día consultado aparece
  siempre junto al total.
- Los desgloses no omiten silenciosamente actores sin ventas: se muestran con `0,00 €` e incluyen a
  todos los camareros activos y a todos los platos de la carta vigente, además de cualquier actor
  con ventas ese día aunque ya no esté activo o en la carta.
- Las filas de los desgloses y de sus comparaciones se ordenan por importe descendente y, a
  igualdad, por nombre alfabético.
- La etiqueta «sin base de comparación» sustituye al porcentaje cuando el día anterior no tuvo
  ventas; la diferencia se expresa siempre en euros (FR-011, SC-006). Se aplica al total y a cada
  fila de los desgloses de comparación.
- La tendencia nunca depende solo del color: siempre incluye texto e icono (accesibilidad).
- La página no permite editar ni introducir datos: es de solo lectura.

## Accesibilidad y localización

- Etiquetas y textos en español de España.
- Tablas con cabeceras semánticas y contraste suficiente en los indicadores de tendencia.
- Indicador de estado nunca basado únicamente en el color.
