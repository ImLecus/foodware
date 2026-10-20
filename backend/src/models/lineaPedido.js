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

export function buscarLineaDePedido(db, pedidoId, lineaId) {
  return (
    db
      .prepare(
        `
        SELECT
          l.id,
          l.pedido_id AS pedidoId,
          l.plato_id AS platoId,
          pl.nombre AS nombrePlato,
          l.cantidad,
          l.estado,
          l.listo_en AS listoEn,
          pl.partida_codigo AS partida
        FROM lineas_pedido l
        JOIN platos pl ON pl.id = l.plato_id
        WHERE l.id = ? AND l.pedido_id = ?
        `,
      )
      .get(lineaId, pedidoId) ?? null
  );
}

export function actualizarEstadoLinea(db, lineaId, estado, listoEn) {
  db.prepare('UPDATE lineas_pedido SET estado = ?, listo_en = ? WHERE id = ?').run(
    estado,
    listoEn,
    lineaId,
  );
}

export function contarLineasPendientes(db, pedidoId) {
  return db
    .prepare(
      "SELECT COUNT(*) AS total FROM lineas_pedido WHERE pedido_id = ? AND estado = 'pendiente'",
    )
    .get(pedidoId).total;
}
