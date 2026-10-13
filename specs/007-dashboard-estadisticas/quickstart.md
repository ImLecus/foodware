# Guía de validación (quickstart): Dashboard de estadísticas del servicio

Escenarios ejecutables para comprobar el dashboard de extremo a extremo. No incluye código de
implementación; el detalle técnico está en `plan.md`, `data-model.md` y `contracts/`.

## Requisitos previos

- Docker con `docker-compose` instalado.
- Repositorio con el backend y el frontend definidos en `plan.md`.
- Usuario de prueba con rol `encargado` y, al menos, un usuario con rol `camarero`.

## Puesta en marcha

```bash
# Levantar backend y frontend
docker compose up --build

# (Opcional) cargar datos semilla: cuentas cerradas de ayer y hoy
docker compose exec backend npm run seed
```

- Frontend en `http://localhost:5173` (o el puerto definido).
- API en `http://localhost:3000/api`.

## Pruebas automatizadas

```bash
# Backend: unidad (agregación) + contrato/integración del endpoint
docker compose exec backend npm test

# Frontend: pruebas de componente de la página del dashboard
docker compose exec frontend npm test
```

Resultado esperado: todas las pruebas en verde (cálculo de totales, diferencias y tendencia;
contrato del endpoint; estados de la página).

## Escenarios de verificación (desde la interfaz)

### E1. Visión global del total (US1, SC-001, FR-002)
1. Iniciar sesión como **encargado** y abrir `/dashboard`.
2. **Esperado**: se ve el total del día en euros en primer plano (`1.287,50 €`).

### E2. Desglose por camarero (US2, FR-003)
1. En el mismo dashboard, mirar la tabla "por camarero".
2. **Esperado**: cada camarero del día con su número de cuentas e importe; los que no vendieron
   aparecen con `0,00 €` (no se omiten).

### E3. Desglose por plato (US2, FR-004)
1. Mirar la tabla "por plato".
2. **Esperado**: cada plato vendido con partida, cantidad e importe.

### E4. Comparación con el día anterior (US3, FR-005/FR-006/FR-010, SC-003)
1. Observar el bloque de comparación.
2. **Esperado**: diferencia de importe y porcentaje frente a ayer, con indicador "subida"
   (verde), "bajada" (rojo) o "sin variación" (neutro), con **texto e icono**; además, las
   diferencias por camarero y por plato.

### E5. Día sin ventas (edge case, FR-007)
1. Consultar un día sin cuentas cerradas.
2. **Esperado**: total `0,00 €` y, si no hay día anterior, mensaje "sin datos anteriores para
   comparar".

### E6. Acceso restringido (FR-001 de contexto, contrato API)
1. Iniciar sesión como **camarero** e intentar abrir `/dashboard`.
2. **Esperado**: no aparece la entrada de navegación y la ruta muestra "acceso restringido".
3. Llamar a `GET /api/reports/daily` sin rol encargado → `403`.

### E7. Consistencia con las cuentas cerradas (SC-004, FR-008)
1. Cerrar una cuenta nueva (historia 06) para hoy.
2. Recargar el dashboard.
3. **Esperado**: el total del día aumenta exactamente en el importe de esa cuenta.

### E8. Sin conexión (aclaración de la spec)
1. Con el dashboard abierto, cortar la red o detener el backend.
2. Recargar/refrescar.
3. **Esperado**: mensaje de "sin conexión"/error, sin pérdida de la última vista conservada.

### E9. Rendimiento (SC-005)
1. Con un día de datos representativo, cronometrar la carga del dashboard.
2. **Esperado**: los datos se muestran en menos de 3 s.

## Comprobación del contrato de la API

```bash
# Como encargado (con credenciales/sesión válidas)
curl -s "http://localhost:3000/api/reports/daily?date=2026-10-13"

# Esperado: JSON conforme a contracts/reports-api.md
# - 401 sin autenticación
# - 403 con rol camarero
# - 400 con date inválido (p. ej. ?date=2026-13-99)
```

## Referencias

- Funcionalidad: [spec.md](./spec.md)
- Decisiones técnicas: [research.md](./research.md)
- Modelo de datos: [data-model.md](./data-model.md)
- Contratos: [contracts/reports-api.md](./contracts/reports-api.md),
  [contracts/dashboard-ui.md](./contracts/dashboard-ui.md)
