/** Todas las líneas del pedido (incluidas las ya listas). */
export function listarLineasDePedido(db, pedidoId) {
  return db
    .prepare(
      `
      SELECT l.id, pl.nombre AS nombre_plato, l.cantidad, l.estado, l.listo_en
      FROM lineas_pedido l
      JOIN platos pl ON pl.id = l.plato_id
      WHERE l.pedido_id = ?
      ORDER BY l.id ASC
      `,
    )
    .all(pedidoId);
}
