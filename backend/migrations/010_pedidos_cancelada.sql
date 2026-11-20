-- Historia 002: cancelación completa de un pedido enviado.
--
-- Se usa una columna explícita para no reconstruir la tabla `pedidos` ni perder
-- las referencias de otras historias. El estado expuesto por la API es
-- `cancelada` cuando `cancelada = 1`; las consultas de cocina y sala excluyen
-- estos pedidos por `cancelada = 0`.

ALTER TABLE pedidos ADD COLUMN cancelada INTEGER NOT NULL DEFAULT 0 CHECK (cancelada IN (0, 1));
