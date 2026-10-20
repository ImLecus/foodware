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
| GET | `/pedidos/{id}` | Pedido con estado de modificación y bloqueo | FR-010 |
| GET | `/pedidos/{id}/editar` | Consultar estado del bloqueo (`libre`, `bloqueado`, `expirado`) | FR-015 |
| POST | `/pedidos/{id}/editar` | Tomar el bloqueo de edición | FR-001, FR-012, FR-015 |
| DELETE | `/pedidos/{id}/editar` | Liberar el bloqueo al cancelar o salir | FR-015 |
| POST | `/pedidos/{id}/lineas` | Añadir plato al pedido enviado | FR-002 |
| PATCH | `/pedidos/{id}/lineas/{lineaId}` | Ajustar cantidad / corregir indicaciones | FR-004, FR-005 |
| DELETE | `/pedidos/{id}/lineas/{lineaId}` | Retirar plato (sin dejar el pedido vacío) | FR-003, FR-011 |
| POST | `/pedidos/{id}/enviar-cambios` | Comunicar cambios a cocina explícitamente y liberar el bloqueo | FR-014, FR-015 |

### Códigos de estado relevantes

- `409 Conflict`: pedido no editable (p. ej. `cerrada`), operación que dejaría el pedido vacío o
  bloqueo del solicitante **expirado** (`codigo: bloqueo_expirado`; debe reabrir el pedido).
- `423 Locked`: pedido bloqueado por otro camarero con bloqueo **vigente** (`codigo:
  pedido_bloqueado`).

## Eventos SSE (tiempo real)

- `GET /eventos` (SSE, `text/event-stream`): stream del hub compartido; publica el evento
  `pedido-modificado` al ejecutar «enviar cambios».

## Contrato de UI (sala)

- Al abrir un pedido **enviado**, se entra en modo edición (se toma el bloqueo).
- El editor permite **añadir, retirar y ajustar** platos y **corregir indicaciones**.
- El pedido editado se muestra **marcado como modificado**.
- Existe una acción explícita **"Enviar cambios"**; mientras haya cambios sin enviar, se indica
  como pendientes. Al enviarlos se libera el bloqueo.
- **Cancelar o salir** de la edición libera el bloqueo sin marcar el pedido como modificado.
- El bloqueo caduca automáticamente tras un periodo de **inactividad configurable**
  (`BLOQUEO_INACTIVIDAD_MINUTOS`, 15 minutos por defecto); el editor avisa de que debe reabrir el
  pedido si intenta guardar con el bloqueo expirado.
- Si el pedido lo está editando otro camarero, se muestra un aviso y no se permite editar.
- Estado **sin conexión**: se bloquea guardar/enviar y se conserva lo escrito en pantalla.
- Idioma: español de España; importes en euros.

Este contrato de UI se valida manualmente según [`../quickstart.md`](../quickstart.md).
