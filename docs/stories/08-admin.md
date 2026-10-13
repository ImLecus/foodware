# Historia 08 - Gestión de la carta

## Responsable: **Danil Launov**

#### Historia de usuario: Como administrador, quiero gestionar los platos de la carta, sus precios y su disponibilidad, para que la carta ofrecida en las tabletas de sala esté siempre actualizada y no se tomen pedidos que cocina no pueda preparar.

#### Especificación (spec)

La carta del restaurante no es inmutable: con el tiempo cambian los platos, se ajustan los
precios o desaparecen ingredientes. El administrador necesita poder gestionar la carta desde la
aplicación, de forma que pueda crear nuevos platos, modificar los existentes y ajustar sus
precios cuando sea necesario, sin depender de soporte técnico ni de cambios manuales fuera
del sistema. Toda modificación queda reflejada automáticamente en las tabletas de sala.

Además del catálogo y los precios, el administrador debe controlar la disponibilidad de cada
plato. Si un ingrediente se agota, debe poder marcar ese plato como no disponible, y esta
misma situación puede producirse de forma automática, por ejemplo cuando el stock del
ingrediente llega a cero. El plato afectado deja de ofrecerse en las tabletas de sala, de manera
que el camarero no pueda tomar un pedido que cocina no podrá preparar.

Al tratarse de una operación sensible, gestionar la carta es una tarea exclusiva del
administrador: solo él puede añadir, editar, cambiar precios o cambiar la disponibilidad de los
platos, mientras que el resto de los usuarios simplemente ven la carta vigente. Esto garantiza
que la información ofrecida a los clientes sea siempre coherente y esté supervisada por la
persona responsable.

#### Criterios de aceptación

- El administrador puede crear nuevos platos en la carta.
- El administrador puede modificar los platos existentes y sus precios.
- El administrador puede marcar un plato como disponible o no disponible.
- Un plato marcado como no disponible deja de ofrecerse en las tabletas de sala.
- Si un ingrediente se agota, el plato correspondiente se vuelve no disponible automáticamente.
- Las modificaciones de la carta se reflejan de inmediato en las tabletas de sala.
- Solo el administrador puede realizar cambios en la carta, precios y disponibilidad.