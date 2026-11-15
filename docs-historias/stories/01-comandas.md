# Historia 01 - Comandas

## Responsable: **Marcos González**

#### Historia de usuario: Como camarero, quiero abrir una mesa y tomar la comanda plato a plato agrupada por partidas, para enviar el pedido a cocina de forma ordenada.

#### Especificación (spec)

El camarero, tableta en mano, necesita empezar a atender una mesa en cuanto esta queda
ocupada. Para ello debe poder abrir la mesa desde la aplicación: seleccionarla en el
plano de sala o identificarla por su número, marcar que está ocupada y dejar la comanda
asociada a esa mesa. Mientras la mesa está abierta, el camarero va añadiendo platos uno
a uno, cada uno con su cantidad, tomados de la carta vigente del restaurante.

Cada plato que añade se clasifica automáticamente en su partida correspondiente —entrantes,
principales o postres—, de manera que la comanda se construye ya agrupada por partidas. Antes
de confirmar, el camarero puede revisar lo anotado, modificar cantidades y añadir un mismo
plato varias veces o repetir platos iguales. La comanda en curso permanece editable hasta el
momento de la confirmación.

Al confirmar la comanda, esta queda registrada como enviada y el pedido se remite agrupado
por partidas, de modo que el resto del sistema recibe el pedido ya ordenado por entrantes,
principales y postres. A partir de ese instante la comanda queda vinculada a la mesa abierta
y deja de aceptar cambios directos.

#### Criterios de aceptación

- El camarero puede abrir una mesa indicando que está ocupada.
- La aplicación permite seleccionar la mesa sobre la que se toma la comanda.
- El camarero puede añadir platos a la comanda uno a uno, indicando cantidad.
- Cada plato añadido se agrupa automáticamente en su partida (entrantes, principales o postres).
- Antes de confirmar, el camarero puede modificar las cantidades de los platos añadidos.
- Tras confirmar, la comanda se registra como enviada y queda vinculada a la mesa.
- Al confirmar, el pedido se envía agrupado por partidas.
