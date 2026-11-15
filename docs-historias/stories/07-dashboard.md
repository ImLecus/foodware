# Historia 07 - Dashboard

## Responsable: **Danil Launov**

#### Historia de usuario: Como encargado de turno, quiero ver un dashboard con las estadísticas del servicio —ventas, desgloses y comparación con turnos anteriores—, para valorar el rendimiento del servicio con datos y no solo con impresiones.

#### Especificación (spec)

Una vez terminado el servicio, el encargado del turno necesita una visión de conjunto del
restaurante. Para ello el dashboard debe mostrar cuánto se ha vendido en total durante ese
servicio, de forma clara y a primer golpe de vista, de modo que pueda comprobar de inmediato
el balance de la jornada. Esta visión global es el punto de partida desde el que el encargado
puede profundizar en los datos.

Además del total, el encargado necesita poder desglosar esas ventas para entender qué ha
ocurrido en la sala: cuánto ha facturado cada camarero y qué platos se han vendido más o
menos. El desglose por camarero permite valorar el reparto del trabajo y el volumen atendido
por cada uno, mientras que el desglose por plato deja ver cuáles han tenido más salida y cuáles
han quedado rezagados. Ambos desgloses se ofrecen desde el mismo dashboard sin necesidad
de consultas externas.

Por último, un dato aislado dice poco sin contexto: el encargado debe poder comparar los
resultados del servicio con los de turnos anteriores, de manera que vea con claridad si las
ventas han subido, bajado o se han mantenido. Esta comparación le da la información
necesaria para tomar decisiones y valorar el rendimiento del servicio apoyándose en datos y no
únicamente en impresiones subjetivas.

#### Criterios de aceptación

- El encargado puede consultar el dashboard al terminar el servicio.
- El dashboard muestra el total de ventas del servicio.
- El dashboard permite desglosar las ventas por camarero.
- El dashboard permite desglosar las ventas por plato.
- El dashboard compara los resultados del servicio con los de turnos anteriores.
- La comparación indica claramente si las ventas han subido, bajado o se han mantenido.