PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS ingredientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'agotado'))
);

CREATE TABLE IF NOT EXISTS plato_ingredientes (
  plato_id TEXT NOT NULL REFERENCES platos(id) ON DELETE CASCADE,
  ingrediente_id TEXT NOT NULL REFERENCES ingredientes(id) ON DELETE CASCADE,
  PRIMARY KEY (plato_id, ingrediente_id)
);

CREATE INDEX IF NOT EXISTS idx_plato_ingredientes_plato ON plato_ingredientes(plato_id);
CREATE INDEX IF NOT EXISTS idx_plato_ingredientes_ingrediente ON plato_ingredientes(ingrediente_id);
