# Historia 04 - Marcar Listos

## Responsable: **Israel Izquierdo Sanchís**

#### Historia de usuario: Como cocinero, quiero marcar los platos como listos para servir, para que la pantalla del camarero refleje de inmediato que el plato ya está preparado.

#### Especificación (spec)

Mientras avanza el servicio, el cocinero va preparando los platos de los pedidos pendientes de su
partida. Cuando termina de preparar un plato, lo marca como listo directamente desde la pantalla
de cocina, seleccionando el plato correspondiente dentro de su pedido. De este modo, el propio
cocinero comunica el avance de su trabajo sin necesidad de avisar a nadie de viva voz.

Al marcar un plato como listo, este deja de contarse como pendiente y desaparece de la lista de
pendientes de la partida, mientras los demás platos del mismo pedido continúan mostrándose
hasta que también se completen. El sistema registra el momento en que cada plato se marcó como
listo, de forma que queda constancia del ritmo de preparación de la partida.

La marca surte efecto de inmediato en la pantalla del camarero correspondiente, que pasa a
reflejar que ese plato ya está preparado y puede servirse, sin retrasos ni necesidad de preguntar
a cocina. Así, sala y cocina mantienen una información coherente sobre el estado de cada plato a
lo largo de todo el servicio.

#### Criterios de aceptación

- El cocinero puede marcar un plato como listo desde la pantalla de cocina.
- El cocinero solo puede marcar platos de los pedidos pendientes de su partida.
- Al marcarse como listo, el plato deja de aparecer como pendiente en la pantalla de cocina.
- Los demás platos del mismo pedido siguen mostrándose como pendientes hasta completarse.
- La marca de "listo" se refleja de inmediato en la pantalla del camarero correspondiente.
- El sistema registra el momento en que cada plato se marcó como listo.
