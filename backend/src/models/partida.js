export function existePartida(db, codigo) {
  return Boolean(db.prepare('SELECT 1 FROM partidas WHERE codigo = ?').get(codigo));
}

export function listarPartidas(db) {
  return db.prepare('SELECT codigo, nombre, orden FROM partidas ORDER BY orden').all();
}
