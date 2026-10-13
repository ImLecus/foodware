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
  comparación con el día anterior). Si no se envía `date`, se usa el día actual.
- **Razón**: una sola llamada cubre la pantalla y reduce latencia (SC-005) y complejidad; el
  contrato es sencillo de probar y de consumir.
- **Alternativas consideradas**: endpoints separados por total/desgloses/comparación (más
  peticiones y coordinación en el cliente); GraphQL (fuera del stack obligatorio).

## D5. Autorización por rol

- **Decisión**: el endpoint exige rol `encargado` mediante middleware; el frontend solo muestra la
  ruta `/dashboard` a ese rol. Los accesos sin permiso devuelven `403`.
- **Razón**: la spec restringe el acceso al encargado (FR-001 de contexto) y reutiliza los perfiles
  existentes; mantener la comprobación en el backend evita exponer datos por ocultación en la UI.
- **Alternativas consideradas**: control solo en el frontend (inseguro, descartado); permisos
  granulares por campo (innecesario en v1).

## D6. Visualización de desgloses y comparación

- **Decisión**: tablas de desglose (camarero y plato) y badges de tendencia (icono + color + texto)
  sobre Chakra UI. Sin librería de gráficas.
- **Razón**: los desgloses y la tendencia se comunican con tablas y badges de forma accesible y
  verificable; evita una dependencia extra (simplicidad, I) y facilita las pruebas de componente.
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

- **Decisión**: la aplicación exige conexión; si el dashboard no puede cargar datos, muestra un
  estado de error/"sin conexión" claro y conserva la última vista, sin bloquear el resto de la
  aplicación.
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
