-- Historia 002: edición de pedidos ya enviados.
--
-- La base compartida (001_init.sql) ya incluye el estado `cerrada` en `pedidos`
-- y la columna `indicaciones` en `lineas_pedido`, y la tabla `modificaciones`
-- para la trazabilidad. Esta migración añade lo que falta para la edición.

-- Marca de modificado y cambios pendientes de comunicar a cocina.
ALTER TABLE pedidos ADD COLUMN modificada INTEGER NOT NULL DEFAULT 0 CHECK (modificada IN (0, 1));
ALTER TABLE pedidos ADD COLUMN cambios_pendientes INTEGER NOT NULL DEFAULT 0 CHECK (cambios_pendientes IN (0, 1));
ALTER TABLE pedidos ADD COLUMN cambios_enviados_en TEXT;

-- Bloqueo de edición (el resto de columnas del bloqueo llega en la migración 003).
ALTER TABLE pedidos ADD COLUMN editando_por TEXT REFERENCES usuarios(id);
ALTER TABLE pedidos ADD COLUMN editando_desde TEXT;

-- Trazabilidad: autor y línea afectada de cada modificación.
ALTER TABLE modificaciones ADD COLUMN camarero_id TEXT REFERENCES usuarios(id);
ALTER TABLE modificaciones ADD COLUMN linea_id TEXT REFERENCES lineas_pedido(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS modificaciones_por_pedido_momento
  ON modificaciones(pedido_id, creada_en);
