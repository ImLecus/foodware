export function buscarCocinero(db, id) {
  const cocinero = db
    .prepare("SELECT id, nombre, partida_codigo FROM usuarios WHERE id = ? AND rol = 'cocinero'")
    .get(id);

  if (!cocinero) return null;

  return {
    id: cocinero.id,
    nombre: cocinero.nombre,
    partida: cocinero.partida_codigo ?? null,
  };
}
