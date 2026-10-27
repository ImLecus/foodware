-- Historia 006: una cuenta pertenece a una comanda concreta.
-- Permite reutilizar una mesa sin que una cuenta cerrada anterior bloquee la
-- nueva comanda y conserva el histórico por pedido.

ALTER TABLE cuentas ADD COLUMN pedido_id TEXT REFERENCES pedidos(id);

CREATE INDEX IF NOT EXISTS cuentas_por_pedido ON cuentas(pedido_id);
CREATE UNIQUE INDEX IF NOT EXISTS cuentas_un_pedido
  ON cuentas(pedido_id)
  WHERE pedido_id IS NOT NULL;
