# Contratos — historia 002

Interfaces que esta funcionalidad expone al resto del sistema, ampliando las de la historia 001.

## API HTTP (backend ExpressJS)

- **Formato**: OpenAPI 3.0.3 → [`openapi.yaml`](./openapi.yaml)
- **Prefijo**: `/api`
- **Importes**: enteros en céntimos.
- **Identificación**: middleware de identidad de la 001 (camarero de la sesión).

### Resumen de endpoints

| Método | Ruta | Propósito | FR |
|--------|------|-----------|----|
| GET | `/comandas/{id}` | Comanda con estado de modificación y bloqueo | FR-010 |
| POST | `/comandas/{id}/editar` | Tomar el bloqueo de edición | FR-001, FR-012, FR-015 |
| DELETE | `/comandas/{id}/editar` | Liberar el bloqueo | FR-015 |
| POST | `/comandas/{id}/lineas` | Añadir plato a la comanda enviada | FR-002 |
| PATCH | `/comandas/{id}/lineas/{lineaId}` | Ajustar cantidad / corregir indicaciones | FR-004, FR-005 |
| DELETE | `/comandas/{id}/lineas/{lineaId}` | Retirar plato (sin dejar la comanda vacía) | FR-003, FR-011 |
| POST | `/comandas/{id}/enviar-cambios` | Comunicar cambios a cocina explícitamente | FR-014 |

### Códigos de estado relevantes

- `409 Conflict`: comanda no editable (p. ej. cerrada) o operación que dejaría la comanda vacía.
- `423 Locked`: comanda bloqueada por otro camarero (FR-015).

## Contrato de UI (sala)

- Al abrir una comanda **enviada**, se entra en modo edición (se toma el bloqueo).
- El editor permite **añadir, retirar y ajustar** platos y **corregir indicaciones**.
- La comanda editada se muestra **marcada como modificada**.
- Existe una acción explícita **"Enviar cambios"**; mientras haya cambios sin enviar, se indica
  como pendientes.
- Si la comanda la está editando otro camarero, se muestra un aviso y no se permite editar.
- Estado **sin conexión**: se bloquea guardar/enviar y se conserva lo escrito en pantalla.
- Idioma: español de España; importes en euros.

Este contrato de UI se valida manualmente según [`../quickstart.md`](../quickstart.md).
