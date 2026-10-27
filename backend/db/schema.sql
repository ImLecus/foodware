PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS partidas (
  codigo TEXT PRIMARY KEY CHECK (codigo IN ('entrantes', 'principales', 'postres')),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS platos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  partida_codigo TEXT NOT NULL REFERENCES partidas(codigo),
  precio_centimos INTEGER NOT NULL CHECK (precio_centimos > 0),
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1))
);

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

CREATE INDEX IF NOT EXISTS idx_platos_partida_codigo ON platos(partida_codigo);
CREATE INDEX IF NOT EXISTS idx_plato_ingredientes_ingrediente_id ON plato_ingredientes(ingrediente_id);
CREATE INDEX IF NOT EXISTS idx_plato_ingredientes_plato_id ON plato_ingredientes(plato_id);
