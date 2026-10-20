import { randomUUID } from 'node:crypto';
import { liberarMesa, marcarMesaOcupada } from './mesas.js';

const LINEA_CAMPOS = `l.id,
                      l.pedido_id,
                      l.plato_id,
                      p.nombre AS plato_nombre,
                      l.cantidad,
                      l.precio_centimos,
                      p.partida_codigo AS partida`;

const LINEA_JOIN = `FROM lineas_pedido l
                      JOIN platos p ON p.id = l.plato_id
                      JOIN partidas pa ON pa.codigo = p.partida_codigo`;

function listarLineas(db, pedidoId) {
  return db
    .prepare(
      `SELECT ${LINEA_CAMPOS} ${LINEA_JOIN}
        WHERE l.pedido_id = ?
        ORDER BY pa.orden, l.rowid`,
    )
    .all(pedidoId);
}

/** Devuelve el pedido con sus líneas o `null` si no existe. */
export function obtenerPedido(db, pedidoId) {
  const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pedidoId);
  if (!pedido) return null;
  return { ...pedido, lineas: listarLineas(db, pedidoId) };
}

export function obtenerPedidoEnCursoPorMesa(db, mesaId) {
  return (
    db.prepare("SELECT * FROM pedidos WHERE mesa_id = ? AND estado = 'en_curso'").get(mesaId) ??
    null
  );
}

/** Crea el pedido en curso de la mesa y la marca ocupada en una transacción. */
export function crearPedido(db, { mesaId, camareroId }) {
  const id = randomUUID();
  const crear = db.transaction(() => {
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES (?, ?, ?, 'en_curso')",
    ).run(id, mesaId, camareroId);
    marcarMesaOcupada(db, mesaId);
  });
  crear();
  return obtenerPedido(db, id);
}

export function obtenerLinea(db, lineaId) {
  return db.prepare(`SELECT ${LINEA_CAMPOS} ${LINEA_JOIN} WHERE l.id = ?`).get(lineaId) ?? null;
}

export function anadirLinea(db, { pedidoId, platoId, cantidad, precioCentimos }) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(id, pedidoId, platoId, cantidad, precioCentimos);
  return obtenerLinea(db, id);
}

export function modificarCantidadLinea(db, lineaId, cantidad) {
  db.prepare('UPDATE lineas_pedido SET cantidad = ? WHERE id = ?').run(cantidad, lineaId);
  return obtenerLinea(db, lineaId);
}

export function retirarLinea(db, lineaId) {
  db.prepare('DELETE FROM lineas_pedido WHERE id = ?').run(lineaId);
}

/** Confirma el pedido: pasa a `enviada` y fija el momento de confirmación. */
export function confirmarPedido(db, pedidoId) {
  db.prepare(
    "UPDATE pedidos SET estado = 'enviada', enviado_en = datetime('now') WHERE id = ?",
  ).run(pedidoId);
  return obtenerPedido(db, pedidoId);
}

/**
 * Anula el pedido en curso: elimina el pedido y sus líneas (en cascada) y deja
 * la mesa libre, todo en la misma transacción (FR-019).
 */
export function anularPedido(db, pedidoId) {
  const pedido = db.prepare('SELECT mesa_id FROM pedidos WHERE id = ?').get(pedidoId);
  const anular = db.transaction(() => {
    db.prepare('DELETE FROM pedidos WHERE id = ?').run(pedidoId);
    liberarMesa(db, pedido.mesa_id);
  });
  anular();
  return pedido.mesa_id;
}
