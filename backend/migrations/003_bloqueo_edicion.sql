-- Historia 002: caducidad del bloqueo de edición por inactividad.
--
-- `editando_ultima_actividad` se refresca al guardar cada cambio y
-- `bloqueo_expira_en` = última actividad + BLOQUEO_INACTIVIDAD_MINUTOS.
-- La caducidad se evalúa de forma perezosa en cada operación sobre el pedido.

ALTER TABLE pedidos ADD COLUMN editando_ultima_actividad TEXT;
ALTER TABLE pedidos ADD COLUMN bloqueo_expira_en TEXT;

CREATE INDEX IF NOT EXISTS pedidos_bloqueo_edicion
  ON pedidos(editando_por, bloqueo_expira_en);
