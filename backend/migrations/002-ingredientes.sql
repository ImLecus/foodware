CREATE TABLE IF NOT EXISTS ingredientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL CHECK(estado IN ('disponible','agotado')) DEFAULT 'disponible'
);

CREATE TABLE IF NOT EXISTS plato_ingredientes (
  plato_id TEXT NOT NULL,
  ingrediente_id TEXT NOT NULL,
  PRIMARY KEY (plato_id, ingrediente_id),
  FOREIGN KEY (plato_id) REFERENCES platos(id),
  FOREIGN KEY (ingrediente_id) REFERENCES ingredientes(id)
);

CREATE INDEX IF NOT EXISTS idx_plato_ingredientes_ingrediente ON plato_ingredientes(ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_platos_partida ON platos(partida_codigo);
