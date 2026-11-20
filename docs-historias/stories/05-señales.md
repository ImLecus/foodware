# Historia 05 - Señales

## Responsable: **Daniel Alarcón**

#### Historia de usuario: Como camarero, quiero ver en todo momento qué platos de cada mesa están listos con una señal visual y/o sonora, para servir la comida en cuanto esté preparada y evitar que se enfríe esperando en la ventanilla.

#### Especificación (spec)

El camarero necesita seguir el avance de las mesas que está atendiendo mientras se mueve
por la sala, sin tener que acercarse a la ventanilla de cocina ni preguntar a viva voz por
el estado de un pedido. Para ello, su dispositivo muestra las mesas abiertas con el detalle
de sus platos, indicando de un vistazo cuáles ya están listos y cuáles siguen pendientes, de
manera que sepa en todo momento qué puede servir y qué todavía no.

El estado de cada plato se actualiza por sí solo: en cuanto un plato pasa a estar listo, su
indicador cambia en la pantalla del camarero sin que este tenga que refrescar ni volver a
entrar en la mesa. Los platos listos se diferencian de los pendientes mediante una señal
visual clara y bien visible, de modo que el camarero localice la información de cada mesa de
un simple vistazo.

Cuando todos los platos de una mesa están listos, el sistema avisa al camarero con una señal
de atención visual y/o sonora propia de esa mesa, indicándole que el pedido completo está
preparado para servir. El aviso es perceptible aunque el camarero se encuentre en otra parte
de la sala y puede descartarse una vez atendido, para que deje de repetirse y no entorpezca
el resto del servicio.

#### Criterios de aceptación

- El camarero ve, para cada mesa que atiende, el estado de sus platos, diferenciando los que están pendientes de los que están listos.
- El estado de cada plato se actualiza automáticamente en la pantalla del camarero, sin necesidad de refrescar ni de volver a abrir la mesa.
- Los platos listos se señalan con un indicador visual claramente distinguible del de los platos pendientes.
- Cuando todos los platos de una mesa están listos, el sistema emite una señal de aviso visual y/o sonora asociada a esa mesa.
- La señal de aviso es perceptible a distancia y se distingue del resto de información de la pantalla.
- El camarero puede descartar el aviso de una mesa una vez atendido, de modo que deje de repetirse.
