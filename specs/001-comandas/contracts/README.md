# Contratos — historia 001

Interfaces que esta funcionalidad expone al resto del sistema.

## API HTTP (backend ExpressJS)

- **Formato**: OpenAPI 3.0.3 → [`openapi.yaml`](./openapi.yaml)
- **Prefijo**: `/api`
- **Importes**: enteros en céntimos.
- **Identificación**: cada petición lleva el camarero de la sesión existente (ver
  `../research.md` §8).

### Resumen de endpoints

| Método | Ruta | Propósito | FR |
|--------|------|-----------|----|
| GET | `/mesas` | Listar mesas y su estado | FR-002 |
| POST | `/mesas/{mesaId}/abrir` | Abrir mesa e iniciar comanda | FR-001, FR-003, FR-004, FR-005 |
| GET | `/platos` | Carta vigente (platos disponibles) | FR-007 |
| GET | `/comandas/{comandaId}` | Comanda con líneas agrupadas por partida | FR-010 |
| POST | `/comandas/{comandaId}/lineas` | Añadir plato (fija el precio) | FR-006, FR-008, FR-018 |
| PATCH | `/comandas/{comandaId}/lineas/{lineaId}` | Modificar cantidad | FR-011 |
| DELETE | `/comandas/{comandaId}/lineas/{lineaId}` | Retirar plato | FR-012 |
| POST | `/comandas/{comandaId}/confirmar` | Confirmar y devolver pedido agrupado | FR-013, FR-014, FR-015, FR-016, FR-017 |

## Contrato de UI (sala)

- Pantalla de **mesas**: muestra cada mesa con su estado (`libre`/`ocupada`) y permite abrirla.
- Pantalla de **comanda**: muestra los platos **agrupados por partidas**, permite añadir platos con
  cantidad, ajustar/retirar líneas y confirmar.
- Estado **sin conexión**: indicador visible; las acciones de confirmar/modificar quedan
  deshabilitadas y se conserva lo escrito en pantalla.
- Idioma: español de España; importes en euros.

Este contrato de UI se valida manualmente según [`../quickstart.md`](../quickstart.md).
