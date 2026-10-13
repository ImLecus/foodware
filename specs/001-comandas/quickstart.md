# Quickstart — Validación de la historia 001 (Abrir mesa y tomar pedido)

**Feature**: `001-comandas` | **Date**: 2026-10-13

Guía para levantar el sistema y comprobar, **desde la interfaz y sin leer código**, que la
funcionalidad cumple la spec. Los detalles de datos y API están en
[`data-model.md`](./data-model.md) y [`contracts/openapi.yaml`](./contracts/openapi.yaml).

## Prerrequisitos

- Docker y Docker Compose instalados.
- Puertos libres: `5173` (frontend) y `3000` (backend).
- No se necesitan credenciales en el repositorio: la configuración va por variables de entorno
  (`.env`, no versionado).

## Puesta en marcha

```bash
# 1. Variables de entorno (ejemplo)
cp .env.example .env

# 2. Levantar base de datos, backend y frontend
docker compose up --build

# 3. Cargar datos de ejemplo (mesas y carta de prueba)
docker compose exec backend npm run seed
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- El estado de sala/cocina se actualiza en vivo por SSE (`GET /api/eventos`), sin recargar.
- Comprobar salud del backend: `GET http://localhost:3000/api/health` → `200`.

## Ejecutar las pruebas automatizadas

```bash
# Backend (API + dominio, con SQLite de test)
docker compose run --rm backend npm test

# Frontend (componentes con React Testing Library)
docker compose run --rm frontend npm test
```

Resultado esperado: todas las pruebas en verde.

## Escenarios de validación manual

Cada escenario corresponde a un criterio de aceptación de la spec.

1. **Abrir una mesa (FR-001, FR-002, FR-003, FR-004)**
   En la pantalla de sala, selecciona una mesa libre y ábrela. Resultado esperado: la mesa pasa a
   mostrarse como ocupada y se abre su pedido.

2. **Añadir platos plato a plato (FR-006, FR-007, FR-008)**
   Añade un entrante, un principal y un postre con sus cantidades; añade dos veces el mismo plato.
   Resultado esperado: cada plato aparece en el pedido con su cantidad y se admiten repeticiones.

3. **Agrupación automática por partidas (FR-009, FR-010)**
   Revisa el pedido. Resultado esperado: los platos aparecen agrupados en entrantes, principales y
   postres, sin que el camarero los clasifique a mano.

4. **Ajustar antes de confirmar (FR-011, FR-012)**
   Cambia la cantidad de un plato y retira otro. Resultado esperado: el pedido refleja los cambios
   mientras sigue en curso.

5. **Confirmar y enviar agrupado (FR-013, FR-015, FR-016, FR-017)**
   Confirma el pedido. Resultado esperado: el pedido queda como "enviada", vinculado a su mesa, y
   el pedido queda disponible agrupado por partidas (visible en `GET /api/pedidos/{id}`).

6. **Precio fijado al pedir (FR-018)**
   Con un pedido en curso, cambia el precio del plato en la carta (historia 008) y vuelve a mirar
   el pedido. Resultado esperado: el precio de los platos ya pedidos **no** cambia.

7. **Pedido vacío (FR-014)**
   Intenta confirmar un pedido sin platos. Resultado esperado: el sistema impide confirmarla y lo
   indica.

8. **Sin duplicar pedido por mesa (FR-005)**
   Intenta abrir de nuevo una mesa que ya tiene pedido en curso. Resultado esperado: el sistema no
   crea una segunda pedido.

9. **Exige conexión (clarificación de la spec)**
   Detén el backend (`docker compose stop backend`) con un pedido abierto. Resultado esperado: la
   pantalla muestra "sin conexión", no permite confirmar y conserva en pantalla lo ya anotado.

## Criterios de éxito a comprobar

- **SC-001**: abrir mesa y confirmar un pedido de 3 platos (una por partida) en menos de 2 min.
- **SC-002**: el pedido confirmado llega agrupado por partidas sin mezclar partidas.
- **SC-003**: 0 pedidos duplicados por mesa abierta.
- **SC-005**: al confirmar, el 100 % de los platos anotados aparece en el pedido enviado.

## Fuera de alcance (no se valida aquí)

Edición de pedidos enviados (002), pantalla de cocina (003), marcar platos como listos (004),
señales al camarero (005), cierre de cuenta (006), dashboard (007) y gestión de la carta (008).
