import { randomUUID } from 'node:crypto';

/**
 * Registra un cambio sobre un pedido (append-only, FR-013).
 * `tipo` admite los valores de la tabla: anadir, retirar, ajustar_cantidad, corregir.
 */
export function registrarModificacion(
  db,
  { pedidoId, camareroId, tipo, lineaId = null, detalle = null },
) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO modificaciones (id, pedido_id, camarero_id, tipo, linea_id, detalle)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, pedidoId, camareroId, tipo, lineaId, detalle === null ? null : JSON.stringify(detalle));

  return db.prepare('SELECT * FROM modificaciones WHERE id = ?').get(id);
}

export function listarModificaciones(db, pedidoId) {
  return db
    .prepare(
      `SELECT * FROM modificaciones
        WHERE pedido_id = ?
        ORDER BY creada_en, rowid`,
    )
    .all(pedidoId);
}
