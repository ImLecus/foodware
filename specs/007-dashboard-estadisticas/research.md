# Investigación (Fase 0): Dashboard de estadísticas del servicio

Resuelve las incógnitas del Contexto Técnico y fija las decisiones de diseño para la
funcionalidad. No hay marcadores `NEEDS CLARIFICATION` pendientes: cada punto queda decidido con
su justificación.

## D1. Estrategia de agregación: bajo demanda frente a precalculada

- **Decisión**: agregar bajo demanda con consultas SQL (`SUM`/`GROUP BY`) sobre las cuentas
  cerradas de un día, en el momento de la petición.
- **Razón**: el volumen es el de un restaurante medio (decenas de cuentas por día); la agregación
  garantiza que las cifras coincidan exactamente con las cuentas cerradas (SC-004, FR-008) sin
  riesgo de desincronización. Cumple el principio de simplicidad (constitución, I).
- **Alternativas consideradas**: tabla de agregados diarios precalculada y actualizada al cerrar
  cada cuenta (más rápida pero introduce sincronización y duplicación de la verdad); caché en
  memoria (complejidad y posibles datos obsoletos).

## D2. Definición del "día" y comparación

- **Decisión**: el servicio corresponde al día natural en zona `Europe/Madrid` (00:00–24:00). El
  día anterior es el día natural inmediatamente anterior. La comparación incluye importe absoluto,
  porcentaje de diferencia y tendencia (subida/bajada/sin variación).
- **Razón**: la spec aclara que la comparación es contra el día natural anterior; usar una zona
  fija evita desajustes por cambios horarios y mantiene la consistencia (FR-005, FR-010, FR-006).
- **Alternativas consideradas**: comparación por turnos (descartada por la aclaración del equipo);
  zona horaria del navegador (descartada por no determinista entre dispositivos).

## D3. Fuente de verdad de las ventas

- **Decisión**: la fuente son las **cuentas cerradas** y sus consumos con el precio fijado en el
  momento de pedir. El dashboard solo lee; nunca crea ni modifica cuentas.
- **Razón**: la spec declara esa dependencia y la fija el precio al pedir (historias 01 y 06); así
  el total del dashboard coincide con lo cobrado (SC-004).
- **Alternativas consideradas**: recalcular con el precio actual de la carta (descartada: altera
  importes ya cobrados); usar pedidos enviados en lugar de cuentas cerradas (descartada: incluiría
  consumo no cobrado).

## D4. Diseño de la API

- **Decisión**: un único endpoint de solo lectura `GET /api/reports/daily?date=YYYY-MM-DD` que
  devuelve el informe diario completo (total, desglose por camarero, desglose por plato y
  comparación con el día anterior). Si no se envía `date`, se usa el último día natural completado
  anterior a hoy; el día en curso no se usa aunque tenga cuentas cerradas.
- **Razón**: una sola llamada cubre la pantalla y reduce latencia (SC-005) y complejidad; el
  contrato es sencillo de probar y de consumir.
- **Alternativas consideradas**: endpoints separados por total/desgloses/comparación (más
  peticiones y coordinación en el cliente); GraphQL (fuera del stack obligatorio).

## D5. Autorización por rol

- **Decisión**: el endpoint exige sesión válida y rol `encargado` mediante `autenticar` y
  `requireRole`; el frontend solo muestra la ruta `/dashboard` a ese rol. Sin sesión se devuelve
  `401` y con otro rol `403`.
- **Razón**: la spec restringe el acceso al encargado (FR-001 de contexto) y reutiliza los perfiles
  existentes; mantener la comprobación en el backend evita exponer datos por ocultación en la UI.
- **Alternativas consideradas**: control solo en el frontend (inseguro, descartado); permisos
  granulares por campo (innecesario en v1).

## D6. Visualización de desgloses y comparación

- **Decisión**: tablas de desglose (camarero y plato), ordenadas por importe descendente y, a
  igualdad, por nombre alfabético; badges de tendencia (icono + color + texto) sobre Chakra UI y la
  fecha del día consultado visible junto al total. Sin librería de gráficas.
- **Razón**: los desgloses y la tendencia se comunican con tablas y badges de forma accesible y
  verificable; el orden descendente responde a la pregunta «qué se vende más» y la fecha evita
  confundir el último día completado con el día en curso (FR-012, FR-013). Evita una dependencia
  extra (simplicidad, I) y facilita las pruebas de componente.
- **Alternativas consideradas**: gráficas con Recharts (dependencia no justificada por la spec).

## D7. Estrategia de pruebas

- **Decisión**: Vitest (unitarias de agregación y de formato), Supertest (contrato e integración
  del endpoint sobre datos sembrados) y React Testing Library (estados del componente).
- **Razón**: un único runner reduce configuración; cubre cálculo, contrato HTTP y UI, como exige la
  constitución ("sin pruebas, la funcionalidad no está completa").
- **Alternativas consideradas**: Jest (mayor configuración con Vite/ESM); solo pruebas manuales
  (descartado por la constitución).

## D8. Formato de importes y fechas

- **Decisión**: usar `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })` y
  `Intl.DateTimeFormat('es-ES')` tanto en backend (contrato con valores ya formateados cuando
  aplique) como en frontend.
- **Razón**: cumple el principio II (español de España y euro) y FR-009/SC sin lógica manual.
- **Alternativas consideradas**: formateo manual con separadores (más propenso a errores).

## D9. Almacenamiento

- **Decisión**: SQLite con `better-sqlite3`, fichero persistente montado en un volumen Docker.
- **Razón**: persistencia necesaria para comparar con días anteriores; SQLite es reproducible y
  sin servidor, coherente con la simplicidad y con un despliegue Docker sencillo.
- **Alternativas consideradas**: PostgreSQL/MySQL (servicio adicional no requerido en v1);
  almacén en memoria (perdería el histórico entre reinicios).
- **Nota de equipo**: decisión transversal al proyecto; debe confirmarse con el resto del equipo
  antes de implementar otras historias que escriban datos.

## D10. Comportamiento sin conexión

- **Decisión**: la aplicación exige conexión; si el dashboard no puede cargar datos por un fallo de
  red muestra «sin conexión», pero si el servidor devuelve `400/500` muestra el mensaje de error
  real. En ambos casos conserva la última vista y no bloquea el resto de la aplicación.
- **Razón**: la aclaración de la spec descarta el funcionamiento sin conexión; el dashboard es de
  solo lectura, por lo que no hay escritura que confirmar.
- **Alternativas consideradas**: caché offline con datos locales (fuera de alcance en v1).

## D11. Despliegue y ejecución

- **Decisión**: `docker-compose` con dos servicios (backend y frontend); backend expone la API y
  sirve los estáticos del frontend en producción; comandos documentados en `quickstart.md`.
- **Razón**: cumple la regla de contenedores de la constitución y garantiza un arranque
  reproducible en cualquier máquina del equipo.
- **Alternativas consideradas**: dos contenedores con proxy inverso aparte (más piezas de las
  necesarias en v1).

## D12. Comparación cuando el día anterior no tuvo ventas

- **Decisión**: representar el caso con `sinBaseComparacion = true`, `diferenciaImporte` igual a la
  diferencia absoluta en euros y `diferenciaPorcentaje = null`; la UI muestra la diferencia y la
  etiqueta «sin base de comparación», sin porcentaje. La misma regla se aplica fila a fila en
  `comparacion.porCamarero` y `comparacion.porPlato` cuando ese camarero o plato no vendió el día
  anterior y sí el día consultado (FR-011).
- **Razón**: cumple FR-011 y SC-006 sin dividir entre cero ni inventar una variación relativa; la
  diferencia absoluta sigue aportando información real frente al día anterior. Aplicarlo por fila
  mantiene coherencia con el total y evita porcentajes engañosos en los desgloses.
- **Alternativas consideradas**: mostrar un porcentaje del 100 % (engañoso e incorrecto); ocultar
  la comparación (pierde un dato válido y la diferencia en euros exigida); aplicar la regla solo al
  total (incoherente con los desgloses).

## D13. Universo de los desgloses sin ventas

- **Decisión**: `porCamarero` incluye a todos los usuarios con rol `camarero` y `porPlato` a todos
  los platos de la carta vigente (activos y con ingredientes disponibles, historia 008), aunque no
  hayan vendido en el día; se muestran con `0,00 €` y `cantidad = 0`, sin omitirlos. Además, se
  incluye a cualquier camarero o plato con ventas ese día aunque ya no esté activo o haya salido de
  la carta, para no perder importes cobrados ni romper la suma de los desgloses (SC-004).
- **Razón**: cumple el escenario 3 de la US2 y evita que la ausencia de filas se interprete como un
  error; el conjunto de referencia para las filas a cero es el personal y la carta existentes, no
  solo los vendedores del día, pero las ventas históricas siempre deben aparecer. En v1 no hay
  estado de alta/baja de personal, por lo que «camarero activo» equivale a un usuario con ese rol.
- **Alternativas consideradas**: mostrar solo a quien vendió (contradice la spec y oculta lo que no
  se vende); incluir platos retirados del catálogo (ruido sin valor); inventar un estado de baja de
  personal (alcance no solicitado).

## D14. Orden y fecha visible

- **Decisión**: los desgloses y sus comparaciones se ordenan por importe descendente y, a igualdad,
  por nombre alfabético; la fecha del día consultado se muestra en la cabecera junto al total.
- **Razón**: el orden descendente responde a «qué se vende más y qué se queda rezagado» (US2) y da
  un resultado determinista para las pruebas; la fecha evita confundir el día mostrado con el día
  en curso (FR-012, aclaración 2026-10-28).
- **Alternativas consideradas**: orden alfabético (no responde a la pregunta de negocio); orden de
  carta por partida (útil para la comanda, no para estadísticas); ocultar la fecha (riesgo de
  interpretar ayer como hoy).
