import { createDb } from '../../src/db/index.js';

/** Base en memoria con el catálogo mínimo para las pruebas de la vista de cocina. */
export function crearBase() {
  const db = createDb(':memory:');

  db.exec(`
    INSERT INTO partidas (codigo, nombre, orden) VALUES
      ('entrantes', 'Entrantes', 1),
      ('principales', 'Principales', 2),
      ('postres', 'Postres', 3);

    INSERT INTO usuarios (id, nombre, rol, partida_codigo) VALUES
      ('cocinero-entrantes', 'Marta', 'cocinero', 'entrantes'),
      ('cocinero-sin-partida', 'Sin partida', 'cocinero', NULL),
      ('camarero-1', 'Ana', 'camarero', NULL);

    INSERT INTO mesas (id, identificador, estado) VALUES
      ('mesa-1', 'Mesa 1', 'ocupada'),
      ('mesa-2', 'Mesa 2', 'ocupada'),
      ('mesa-3', 'Mesa 3', 'ocupada'),
      ('mesa-4', 'Mesa 4', 'ocupada');

    INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES
      ('plato-entrante', 'Croquetas', 'entrantes', 850),
      ('plato-entrante-2', 'Ensalada', 'entrantes', 700),
      ('plato-principal', 'Paella', 'principales', 1800),
      ('plato-postre', 'Tarta', 'postres', 600);
  `);

  return db;
}

export function insertarPedido(
  db,
  { id, mesa = 'mesa-1', enviadoEn = '2026-10-20 10:00:00', modificado = 0 } = {},
) {
  db.prepare(
    `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, modificado, enviado_en, modificado_en)
     VALUES (?, ?, 'camarero-1', 'enviada', ?, ?, ?)`,
  ).run(id, mesa, modificado, enviadoEn, modificado ? enviadoEn : null);
}

export function insertarLinea(
  db,
  { id, pedidoId, platoId = 'plato-entrante', cantidad = 1, estado = 'pendiente' } = {},
) {
  db.prepare(
    `INSERT INTO lineas_pedido
       (id, pedido_id, plato_id, cantidad, precio_centimos, estado, listo_en)
     VALUES (?, ?, ?, ?, 100, ?, ?)`,
  ).run(id, pedidoId, platoId, cantidad, estado, estado === 'listo' ? '2026-10-20 10:05:00' : null);
}
