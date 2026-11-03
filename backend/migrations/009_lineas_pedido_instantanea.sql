-- Historia 001: instantánea histórica de nombre y partida.
--
-- El precio ya se fijaba al pedir; nombre y partida deben seguir la misma regla
-- para que los cambios posteriores de la carta (historia 008) no alteren pedidos
-- ni informes históricos.

ALTER TABLE lineas_pedido ADD COLUMN nombre_plato TEXT;
ALTER TABLE lineas_pedido ADD COLUMN partida_codigo TEXT;

-- Rellena las líneas existentes con los datos actuales de la carta.
UPDATE lineas_pedido
   SET nombre_plato = (
         SELECT p.nombre FROM platos p WHERE p.id = lineas_pedido.plato_id
       )
 WHERE nombre_plato IS NULL;

UPDATE lineas_pedido
   SET partida_codigo = (
         SELECT p.partida_codigo FROM platos p WHERE p.id = lineas_pedido.plato_id
       )
 WHERE partida_codigo IS NULL;
