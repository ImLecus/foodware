# Historia 02 - Editar comanda

## Responsable: **Marcos González**

#### Historia de usuario: Como camarero, quiero editar una comanda que ya ha sido enviada, para corregirla cuando el cliente cambia de opinión o añade algo a última hora.

#### Especificación (spec)

En pleno servicio es habitual que un cliente cambie de opinión después de haber enviado el
pedido: pide que se retire un ingrediente, añade un plato a última hora o decide que ya no
quiere algo. El camarero necesita poder reabrir una comanda que ya había sido enviada y
modificarla, en lugar de tener que crear una comanda nueva que duplique el pedido.

Sobre la comanda ya enviada, el camarero puede realizar los cambios habituales: añadir platos
nuevos, retirar platos que ya no se quieren, ajustar cantidades o corregir indicaciones. Estos
cambios se aplican sobre la comanda existente y quedan asociados a esa misma mesa, de forma que
la comanda sigue siendo una única comanda actualizada y no una comanda adicional.

Como el pedido ya había llegado a cocina, el cambio debe quedar marcado de manera clara como una
modificación de la comanda original, para que pueda distinguirse de un pedido nuevo y no se
confunda con el anterior. La comanda mantiene su identidad tras la edición y refleja siempre su
estado actualizado.

#### Criterios de aceptación

- El camarero puede reabrir para edición una comanda que ya ha sido enviada.
- El camarero puede añadir platos nuevos a una comanda ya enviada.
- El camarero puede retirar platos de una comanda ya enviada.
- El camarero puede modificar cantidades o indicaciones de una comanda ya enviada.
- Los cambios se aplican sobre la comanda original, sin crear una comanda nueva.
- La comanda editada queda marcada como modificada, distinguiéndose de un pedido nuevo.
- La comanda sigue vinculada a la misma mesa después de editarla.
