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

export function contarLineasPendientes(db, pedidoId, partida = null) {
  const filtroPartida = partida ? 'AND pl.partida_codigo = ?' : '';
  const parametros = partida ? [pedidoId, partida] : [pedidoId];

  return db
    .prepare(
      `SELECT COUNT(*) AS total
         FROM lineas_pedido l
         JOIN platos pl ON pl.id = l.plato_id
        WHERE l.pedido_id = ?
          AND l.estado = 'pendiente'
          ${filtroPartida}`,
    )
    .get(...parametros).total;
}

/** Líneas del último pedido enviado de una mesa (pantalla del camarero). */
export function listarLineasDeMesa(db, mesaId) {
  return db
    .prepare(
      `
      SELECT
        l.id,
        l.pedido_id AS pedidoId,
        pl.nombre AS nombrePlato,
        l.cantidad,
        l.estado,
        l.listo_en AS listoEn
      FROM lineas_pedido l
      JOIN pedidos p ON p.id = l.pedido_id
      JOIN platos pl ON pl.id = l.plato_id
      WHERE p.mesa_id = ?
        AND p.estado = 'enviada'
        AND p.id = (
          SELECT id FROM pedidos
          WHERE mesa_id = ? AND estado = 'enviada'
          ORDER BY enviado_en DESC, id DESC
          LIMIT 1
        )
      ORDER BY l.id ASC
      `,
    )
    .all(mesaId, mesaId);
}
