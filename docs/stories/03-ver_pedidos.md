# Historia 03 - Ver pedidos

## Responsable: **Israel Izquierdo**

#### Historia de usuario: Como cocinero, quiero ver únicamente los pedidos pendientes que corresponden a mi partida, ordenados por tiempo de espera, para priorizar los platos que llevan más tiempo aguardando.

#### Especificación (spec)

En la cocina cada partida trabaja a su propio ritmo, por lo que el cocinero responsable
necesita una pantalla que le muestre en todo momento los pedidos que aún tiene pendientes de
preparar. Al abrir la aplicación, el cocinero queda identificado con la partida que tiene
asignada —entrantes, principales o postres— y la vista de cocina se carga con los pedidos
correspondientes a esa partida, sin mostrar los de las demás.

La lista de pedidos pendientes se presenta ordenada por tiempo de espera, de modo que los
pedidos más antiguos aparecen en primer lugar y los más recientes al final. Junto a cada
pedido se indica el tiempo transcurrido desde que se envió, para que el cocinero identifique
de un vistazo qué conviene priorizar. Cada pedido muestra además los platos que lo componen
junto con sus cantidades, de forma que el cocinero sabe exactamente qué debe preparar.

La vista se mantiene actualizada conforme avanza el servicio: cuando llega un pedido nuevo
desde sala, aparece en la posición que le corresponde según su antigüedad, y a medida que
los pedidos dejan de estar pendientes la lista se reordena de forma automática. Así el
cocinero trabaja siempre sobre información vigente y sabe en cada momento qué platos le
quedan por preparar y en qué orden abordarlos.

#### Criterios de aceptación

- El cocinero queda identificado con la partida que tiene asignada.
- La pantalla de cocina muestra únicamente los pedidos pendientes de la partida del cocinero.
- Los pedidos se ordenan por tiempo de espera, del más antiguo al más reciente.
- Cada pedido muestra el tiempo transcurrido desde su envío.
- Cada pedido detalla los platos que lo componen y sus cantidades.
- La lista se actualiza automáticamente al recibir nuevos pedidos desde sala.
- La lista se reordena de forma automática al cambiar el estado de los pedidos.
