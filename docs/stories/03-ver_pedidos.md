# Historia 03 - Ver Pedidos

## Responsable: **Israel Izquierdo Sanchís**

#### Historia de usuario: Como cocinero, quiero ver únicamente los pedidos pendientes de mi partida ordenados por tiempo de espera, para priorizar la preparación de los que llevan más tiempo aguardando.

#### Especificación (spec)

El cocinero trabaja en una partida concreta de la cocina y accede a la pantalla de cocina
identificándose con su perfil, de manera que el sistema sepa qué pedidos le corresponden. Al
iniciar su turno, la pantalla le muestra la lista de pedidos pendientes asociados exclusivamente
a su partida, sin mezclar los de las demás partidas, para que pueda concentrarse en su propio
trabajo.

Cada pedido aparece con la información necesaria para prepararlo —los platos que lo componen
con sus cantidades y las observaciones recogidas en la comanda— y ordenado por tiempo de
espera, de forma que los que llevan más tiempo aguardando queden siempre en las primeras
posiciones. La pantalla indica de forma visible el tiempo transcurrido desde que cada pedido
entró en cocina, para que el cocinero identifique de un vistazo qué debe priorizar.

La lista se actualiza en tiempo real a medida que llegan nuevas comandas a la partida, sin que
el cocinero tenga que refrescar la pantalla manualmente, y contiene siempre y únicamente los
pedidos que siguen pendientes. Así, la pantalla de cocina refleja en todo momento la carga real
de trabajo de la partida.

#### Criterios de aceptación

- El cocinero accede a la pantalla de cocina identificándose con su perfil de partida.
- La pantalla muestra únicamente los pedidos pendientes de la partida del cocinero.
- La pantalla no muestra pedidos pendientes de otras partidas.
- Cada pedido muestra los platos que lo componen, con sus cantidades y observaciones.
- Los pedidos se ordenan por tiempo de espera, del más antiguo al más reciente.
- Se muestra el tiempo transcurrido desde que cada pedido entró en cocina.
- La lista se actualiza en tiempo real al llegar nuevos pedidos, sin refresco manual.
