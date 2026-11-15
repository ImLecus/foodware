# Historia 06 - Cerrar cuenta

## Responsable: **Daniel Alarcón**

#### Historia de usuario: Como camarero, quiero cerrar la cuenta de una mesa y repartir su importe entre los comensales, para cobrar de forma correcta y que el ticket refleje la división acordada.

#### Especificación (spec)

Cuando el servicio de una mesa llega a su fin, el camarero necesita cerrar su cuenta y
cobrar el importe de lo consumido. Para ello, desde la mesa selecciona la opción de cerrar
la cuenta y el sistema calcula el total a partir de los platos registrados, con sus precios
vigentes, y lo muestra al camarero antes de confirmar el cobro.

El cobro no siempre se resuelve con un único pago: a menudo los comensales quieren repartir
el importe entre varias personas. El camarero puede dividir la cuenta en tantas partes como
haga falta, ya sea en partes iguales o repartiendo el pago según lo que haya consumido cada
comensal, de manera que cada parte quede asociada a quien le corresponde y el importe total
siga cuadrando.

Al formalizar el cierre, el sistema genera el ticket final reflejando con exactitud la
división realizada, con el total de la cuenta y el desglose de cada parte y su importe. Una
vez confirmado el cobro, la mesa queda cerrada y deja de estar activa, de modo que no admite
nuevas operaciones.

#### Criterios de aceptación

- El camarero puede cerrar la cuenta de una mesa.
- El sistema calcula y muestra el importe total de la cuenta a partir de lo consumido, aplicando los precios vigentes.
- El camarero puede dividir la cuenta entre varios comensales.
- La división puede hacerse en partes iguales o repartiendo el pago según lo consumido por cada comensal.
- La suma de las partes en que se divide la cuenta coincide con el importe total.
- El ticket final refleja el total de la cuenta y el desglose de cada parte con su importe.
- Una vez confirmado el cobro, la mesa queda cerrada y no admite nuevas operaciones.
