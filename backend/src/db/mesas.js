export function listarMesas(db) {
  return db
    .prepare(
      `SELECT m.id,
              m.identificador,
              m.estado,
              (SELECT p.id FROM pedidos p
                WHERE p.mesa_id = m.id AND p.estado = 'en_curso'
                ORDER BY p.creado_en DESC
                LIMIT 1) AS pedido_en_curso_id,
              (SELECT p.id FROM pedidos p
                WHERE p.mesa_id = m.id AND p.estado = 'enviada'
                ORDER BY p.enviado_en DESC, p.rowid DESC
                LIMIT 1) AS pedido_enviado_id
         FROM mesas m
        ORDER BY CAST(REPLACE(m.identificador, 'Mesa ', '') AS INTEGER), m.identificador`,
    )
    .all();
}

/**
 * Lista las mesas abiertas para la vista de sala 005 (comanda en curso o enviada)
 * mientras la mesa no esté cerrada. Devuelve el pedido enviado y/o el pedido
 * en curso por mesa, junto a las líneas enviadas agrupables por partida.
 */
export function listarMesasAbiertasParaSala(db) {
  const mesas = db
    .prepare(
      `SELECT m.id,
              m.identificador,
              m.estado
         FROM mesas m
        WHERE m.estado != 'cerrada'
          AND EXISTS (
                SELECT 1 FROM pedidos p
                WHERE p.mesa_id = m.id AND p.estado IN ('en_curso', 'enviada')
              )
        ORDER BY CAST(REPLACE(m.identificador, 'Mesa ', '') AS INTEGER), m.identificador`,
    )
    .all();

  const obtenerPedidoEnviado = db.prepare(
    `SELECT p.id,
            p.mesa_id,
            p.camarero_id,
            p.estado,
            p.enviado_en
       FROM pedidos p
      WHERE p.mesa_id = ? AND p.estado = 'enviada'
      ORDER BY p.enviado_en DESC
      LIMIT 1`,
  );

  const obtenerPedidoEnCurso = db.prepare(
    `SELECT p.id
       FROM pedidos p
      WHERE p.mesa_id = ? AND p.estado = 'en_curso'
      LIMIT 1`,
  );

  const listarLineasEnviadas = db.prepare(
    `SELECT l.id,
            l.pedido_id,
            l.plato_id,
            l.cantidad,
            l.estado,
            l.listo_en,
            p.nombre AS nombre_plato,
            p.partida_codigo AS partida
       FROM lineas_pedido l
       JOIN platos p ON p.id = l.plato_id
       JOIN partidas pa ON pa.codigo = p.partida_codigo
      WHERE l.pedido_id = ?
      ORDER BY pa.orden, l.rowid`,
  );

  return mesas.map((mesa) => {
    const pedidoEnviado = obtenerPedidoEnviado.get(mesa.id) ?? null;
    const pedidoEnCurso = obtenerPedidoEnCurso.get(mesa.id) ?? null;

    const lineas = pedidoEnviado ? listarLineasEnviadas.all(pedidoEnviado.id) : [];

    return {
      mesa,
      pedidoEnviado,
      pedidoEnCurso,
      lineas,
    };
  });
}

export function obtenerMesa(db, mesaId) {
  return db.prepare('SELECT id, identificador, estado FROM mesas WHERE id = ?').get(mesaId) ?? null;
}

export function marcarMesaOcupada(db, mesaId) {
  db.prepare("UPDATE mesas SET estado = 'ocupada' WHERE id = ?").run(mesaId);
}

export function liberarMesa(db, mesaId) {
  db.prepare("UPDATE mesas SET estado = 'libre' WHERE id = ?").run(mesaId);
}
