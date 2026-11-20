-- Esquema base compartido por todas las historias (v1).
-- Cada historia puede añadir migraciones posteriores (002_..., 003_...).

PRAGMA foreign_keys = ON;

-- Catálogo fijo de partidas -------------------------------------------------
CREATE TABLE IF NOT EXISTS partidas (
  codigo TEXT PRIMARY KEY CHECK (codigo IN ('entrantes', 'principales', 'postres')),
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL
);

-- Usuarios y roles ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('camarero', 'cocinero', 'encargado', 'administrador')),
  partida_codigo TEXT REFERENCES partidas(codigo)
);

-- Mesas ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mesas (
  id TEXT PRIMARY KEY,
  identificador TEXT NOT NULL UNIQUE,
  estado TEXT NOT NULL DEFAULT 'libre' CHECK (estado IN ('libre', 'ocupada', 'cerrada'))
);

-- Carta ---------------------------------------------------------------------
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

-- Pedidos -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
  id TEXT PRIMARY KEY,
  mesa_id TEXT NOT NULL REFERENCES mesas(id),
  camarero_id TEXT NOT NULL REFERENCES usuarios(id),
  estado TEXT NOT NULL DEFAULT 'en_curso' CHECK (estado IN ('en_curso', 'enviada', 'cerrada')),
  modificado INTEGER NOT NULL DEFAULT 0 CHECK (modificado IN (0, 1)),
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  enviado_en TEXT,
  modificado_en TEXT
);

-- Una mesa solo puede tener un pedido en curso a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_un_en_curso_por_mesa
  ON pedidos(mesa_id) WHERE estado = 'en_curso';

CREATE TABLE IF NOT EXISTS lineas_pedido (
  id TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  plato_id TEXT NOT NULL REFERENCES platos(id),
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_centimos INTEGER NOT NULL CHECK (precio_centimos > 0),
  indicaciones TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'listo')),
  listo_en TEXT
);

CREATE INDEX IF NOT EXISTS lineas_por_pedido ON lineas_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS lineas_por_estado ON lineas_pedido(estado);

-- Historial de modificaciones de pedidos ya enviados ------------------------
CREATE TABLE IF NOT EXISTS modificaciones (
  id TEXT PRIMARY KEY,
  pedido_id TEXT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('anadir', 'retirar', 'ajustar_cantidad', 'corregir')),
  detalle TEXT,
  creada_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS modificaciones_por_pedido ON modificaciones(pedido_id);

-- Bloqueo de edición (historia 002) -----------------------------------------
CREATE TABLE IF NOT EXISTS bloqueos_edicion (
  pedido_id TEXT PRIMARY KEY REFERENCES pedidos(id) ON DELETE CASCADE,
  camarero_id TEXT NOT NULL REFERENCES usuarios(id),
  iniciado_en TEXT NOT NULL DEFAULT (datetime('now')),
  ultima_actividad TEXT NOT NULL DEFAULT (datetime('now')),
  expira_en TEXT NOT NULL
);

-- Cuentas y división (historia 006) -----------------------------------------
CREATE TABLE IF NOT EXISTS cuentas (
  id TEXT PRIMARY KEY,
  mesa_id TEXT NOT NULL REFERENCES mesas(id),
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),
  total_centimos INTEGER NOT NULL DEFAULT 0 CHECK (total_centimos >= 0),
  abierta_en TEXT NOT NULL DEFAULT (datetime('now')),
  cerrada_en TEXT
);

CREATE TABLE IF NOT EXISTS cuentas_partes (
  id TEXT PRIMARY KEY,
  cuenta_id TEXT NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  orden INTEGER NOT NULL,
  comensal TEXT NOT NULL,
  importe_centimos INTEGER NOT NULL CHECK (importe_centimos >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada')),
  pagada_en TEXT,
  UNIQUE (cuenta_id, orden)
);

CREATE TABLE IF NOT EXISTS cuentas_parte_consumos (
  id TEXT PRIMARY KEY,
  parte_id TEXT NOT NULL REFERENCES cuentas_partes(id) ON DELETE CASCADE,
  linea_id TEXT NOT NULL REFERENCES lineas_pedido(id),
  importe_centimos INTEGER NOT NULL CHECK (importe_centimos >= 0)
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  cuenta_id TEXT NOT NULL UNIQUE REFERENCES cuentas(id),
  total_centimos INTEGER NOT NULL CHECK (total_centimos >= 0),
  contenido TEXT,
  emitido_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Avisos de mesa completa (historia 005) ------------------------------------
CREATE TABLE IF NOT EXISTS avisos (
  id TEXT PRIMARY KEY,
  mesa_id TEXT NOT NULL REFERENCES mesas(id),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'descartado')),
  generado_en TEXT NOT NULL DEFAULT (datetime('now')),
  descartado_en TEXT
);

CREATE INDEX IF NOT EXISTS avisos_por_mesa ON avisos(mesa_id, estado);
