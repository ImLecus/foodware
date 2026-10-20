/**
 * Pedidos enviados con al menos una línea pendiente en la partida indicada.
 * El orden es determinista: envío ascendente y, a igual envío, id ascendente.
 */
export function listarPedidosConPendientes(db, partidaId) {
  return db
    .prepare(
      `
      SELECT DISTINCT
        p.id,
        p.mesa_id,
        p.enviado_en,
        p.modificado,
        p.modificado_en,
        m.identificador AS mesa_identificador
      FROM pedidos p
      JOIN mesas m ON m.id = p.mesa_id
      JOIN lineas_pedido l ON l.pedido_id = p.id
      JOIN platos pl ON pl.id = l.plato_id
      WHERE p.estado = 'enviada'
        AND l.estado = 'pendiente'
        AND pl.partida_codigo = ?
      ORDER BY p.enviado_en ASC, p.id ASC
      `,
    )
    .all(partidaId);
}
