export function buscarMesa(db, id) {
  return db.prepare('SELECT id, identificador, estado FROM mesas WHERE id = ?').get(id) ?? null;
}

/** Número visible de la mesa a partir de su identificador («Mesa 5» → 5). */
export function numeroDeMesa(identificador) {
  const coincidencia = String(identificador ?? '').match(/\d+/);
  return coincidencia ? Number(coincidencia[0]) : 0;
}
