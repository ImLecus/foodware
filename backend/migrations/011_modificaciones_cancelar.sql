-- Historia 002: el registro de trazabilidad admite el tipo `cancelar`.

CREATE TABLE modificaciones_nuevo (
  id TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('anadir', 'retirar', 'ajustar_cantidad', 'corregir', 'cancelar')),
  detalle TEXT,
  creada_en TEXT NOT NULL DEFAULT (datetime('now')),
  camarero_id TEXT REFERENCES usuarios(id),
  linea_id TEXT REFERENCES lineas_pedido(id) ON DELETE SET NULL
);

INSERT INTO modificaciones_nuevo (id, pedido_id, tipo, detalle, creada_en, camarero_id, linea_id)
SELECT id, pedido_id, tipo, detalle, creada_en, camarero_id, linea_id
  FROM modificaciones;

DROP TABLE modificaciones;
ALTER TABLE modificaciones_nuevo RENAME TO modificaciones;

CREATE INDEX IF NOT EXISTS modificaciones_por_pedido ON modificaciones(pedido_id);
CREATE INDEX IF NOT EXISTS modificaciones_por_pedido_momento
  ON modificaciones(pedido_id, creada_en);
