export function listarMesas(db) {
  return db
    .prepare(
      `SELECT m.id,
              m.identificador,
              m.estado,
              (SELECT p.id FROM pedidos p
                WHERE p.mesa_id = m.id AND p.estado = 'en_curso') AS pedido_en_curso_id
         FROM mesas m
        ORDER BY m.identificador`,
    )
    .all();
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
