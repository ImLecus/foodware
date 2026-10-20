# Guía de validación (quickstart): Gestión de la carta

Escenarios ejecutables para comprobar la gestión de la carta de extremo a extremo. No incluye
código de implementación; el detalle técnico está en `plan.md`, `data-model.md` y `contracts/`.

## Requisitos previos

- Docker con `docker-compose` instalado.
- Repositorio con el backend y el frontend definidos en `plan.md`.
- Un usuario de prueba con rol `administrador` y, al menos, un usuario con rol `camarero`.

## Puesta en marcha

```bash
# Levantar backend y frontend
docker compose up --build

# (Opcional) cargar datos semilla: platos e ingredientes de ejemplo
docker compose exec backend npm run seed
```

- Frontend en `http://localhost:5173` (o el puerto definido).
- API en `http://localhost:3000/api`.

## Pruebas automatizadas

```bash
# Backend: unidad (validación y disponibilidad) + contrato/integración de los endpoints
docker compose exec backend npm test

# Frontend: pruebas de componente de la página de gestión
docker compose exec frontend npm test
```

Resultado esperado: todas las pruebas en verde (validación de precio, partida, nombre y estado de
ingrediente; asociación plato–ingrediente; disponibilidad combinada; contrato de los endpoints;
estados de la página).

## Escenarios de verificación (desde la interfaz)

### E1. Crear un plato (US1, FR-002, SC-001)
1. Iniciar sesión como **administrador** y abrir `/admin/carta`.
2. Crear un plato con nombre, partida y precio.
3. **Esperado**: el plato aparece en la tabla, en su partida, y se ofrece en la carta de sala.

### E2. Modificar nombre o precio (US1, FR-003, FR-004)
1. Editar un plato existente y guardar un precio nuevo.
2. **Esperado**: la tabla muestra el valor actualizado al instante y el precio se ve en euros
   (`7,00 €`); la carta de sala refleja el cambio.

### E3. Precio inválido (edge case, FR-004)
1. Intentar guardar un plato con precio vacío o negativo.
2. **Esperado**: aviso "El precio debe ser mayor que cero"; no se guarda y se conserva el último
   valor válido.

### E4. Partida inválida (edge case, FR-013)
1. Intentar asignar una partida que no sea entrantes, principales o postres.
2. **Esperado**: el sistema lo rechaza con un aviso y conserva la partida válida anterior.

### E5. Baja y alta manual (US2, FR-005/FR-006, SC-003)
1. Marcar un plato como no disponible en la carta de sala.
2. **Esperado**: deja de ofrecerse en las tabletas de sala de inmediato.
3. Volver a marcarlo como disponible.
4. **Esperado**: vuelve a ofrecerse.

### E6. Agotamiento de ingrediente (US3, FR-007, SC-004)
1. En el panel de ingredientes, poner a `agotado` un ingrediente usado por un plato activo.
2. **Esperado**: el plato desaparece de la carta de sala sin que el administrador lo desactive.
3. Reponer el ingrediente a `disponible`.
4. **Esperado**: el plato vuelve a ofrecerse (sigue activo manualmente).

### E7. Disponibilidad combinada (US3, escenario 4, FR-012)
1. Desactivar manualmente un plato y poner a `agotado` uno de sus ingredientes.
2. Reponer el ingrediente a `disponible`.
3. **Esperado**: el plato **no** vuelve a ofrecerse porque sigue desactivado manualmente.

### E8. Plato sin ingredientes (edge case)
1. Crear un plato sin ingredientes asociados.
2. **Esperado**: se ofrece siempre que esté manualmente activo.

### E9. Solo el administrador gestiona (FR-001, SC-005)
1. Iniciar sesión como **camarero** e intentar abrir `/admin/carta`.
2. **Esperado**: no aparece la entrada de menú y la ruta muestra "acceso restringido".
3. Llamar a `PATCH /api/admin/platos/:id` sin rol administrador → `403`.

### E10. Sin conexión (aclaración de la spec)
1. Con la página de gestión abierta, cortar la red o detener el backend.
2. Intentar guardar un cambio.
3. **Esperado**: mensaje de "sin conexión", no se aplica el cambio y se conserva lo escrito hasta
   recuperar la conexión.

### E11. Reflejo inmediato en sala (FR-009/FR-010, SC-002)
1. Con la carta de sala abierta en otro dispositivo, cambiar el precio o la disponibilidad de un
   plato.
2. **Esperado**: la carta de sala refleja el cambio en menos de 3 s, sin acciones adicionales.

### E12. Alta de ingrediente, asociación y agotamiento (US3 escenario 5, FR-015, SC-006)
1. En `/admin/carta`, crear un ingrediente con nombre (por ejemplo, "Queso") y estado
   `disponible`.
2. Asociarlo a un plato que esté manualmente activo y comprobar que el plato sigue ofreciéndose.
3. Marcar el ingrediente como `agotado`.
4. **Esperado**: el plato deja de ofrecerse en la carta de sala en 3 s o menos, sin que el
   administrador lo desactive.
5. Volver a marcar el ingrediente como `disponible`; **esperado**: el plato se ofrece de nuevo por
   seguir activo.

## Comprobación del contrato de la API

```bash
# Como administrador (con credenciales/sesión válidas)
curl -s "http://localhost:3000/api/admin/platos"

# Crear un plato
curl -s -X POST "http://localhost:3000/api/admin/platos" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Croquetas","partida":"entrantes","precio":7.00}'

# Crear un ingrediente
curl -s -X POST "http://localhost:3000/api/admin/ingredientes" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Queso","estado":"disponible"}'

# Asociarlo a un plato (sustituye el conjunto de ingredientes)
curl -s -X PATCH "http://localhost:3000/api/admin/platos/p1" \
  -H "Content-Type: application/json" -d '{"ingredienteIds":["i1","i3"]}'

# Poner un ingrediente a agotado
curl -s -X PATCH "http://localhost:3000/api/admin/ingredientes/i2" \
  -H "Content-Type: application/json" -d '{"estado":"agotado"}'

# Carta vigente que ve la sala (cualquier usuario autenticado)
curl -s "http://localhost:3000/api/carta"

# Esperado: JSON conforme a contracts/carta-api.md
# - 401 sin autenticación
# - 403 con rol camarero en endpoints /api/admin/*
# - 400 con precio <= 0, partida no válida, nombre de ingrediente vacío, estado no válido o
#   ingrediente inexistente en la asociación
```

## Referencias

- Funcionalidad: [spec.md](./spec.md)
- Decisiones técnicas: [research.md](./research.md)
- Modelo de datos: [data-model.md](./data-model.md)
- Contratos: [contracts/carta-api.md](./contracts/carta-api.md),
  [contracts/carta-ui.md](./contracts/carta-ui.md)
