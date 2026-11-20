const CAMPOS = `p.id,
                p.nombre,
                p.partida_codigo AS partida,
                p.precio_centimos,
                pa.orden AS partida_orden`;

/** Carta vigente: platos activos (disponibles) ordenados por partida y nombre. */
export function listarPlatosDisponibles(db) {
  return db
    .prepare(
      `SELECT ${CAMPOS}
         FROM platos p
         JOIN partidas pa ON pa.codigo = p.partida_codigo
        WHERE p.activo = 1
        ORDER BY pa.orden, p.nombre`,
    )
    .all()
    .map((fila) => ({
      id: fila.id,
      nombre: fila.nombre,
      partida: fila.partida,
      precio_centimos: fila.precio_centimos,
      disponible: true,
    }));
}

export function obtenerPlato(db, platoId) {
  const fila = db
    .prepare(
      `SELECT ${CAMPOS}, p.activo
         FROM platos p
         JOIN partidas pa ON pa.codigo = p.partida_codigo
        WHERE p.id = ?`,
    )
    .get(platoId);

  if (!fila) return null;

  return {
    id: fila.id,
    nombre: fila.nombre,
    partida: fila.partida,
    precio_centimos: fila.precio_centimos,
    disponible: fila.activo === 1,
  };
}
