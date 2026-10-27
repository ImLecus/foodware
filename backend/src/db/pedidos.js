import { randomUUID } from 'node:crypto';
import { liberarMesa, marcarMesaOcupada } from './mesas.js';

const LINEA_CAMPOS = `l.id,
                      l.pedido_id,
                      l.plato_id,
                      p.nombre AS plato_nombre,
                      l.cantidad,
                      l.precio_centimos,
                      l.indicaciones,
                      l.estado,
                      l.listo_en,
                      p.partida_codigo AS partida`;

const LINEA_JOIN = `FROM lineas_pedido l
                      JOIN platos p ON p.id = l.plato_id
                      JOIN partidas pa ON pa.codigo = p.partida_codigo`;

function listarLineas(db, pedidoId) {
  return db
    .prepare(
      `SELECT ${LINEA_CAMPOS} ${LINEA_JOIN}
        WHERE l.pedido_id = ?
        ORDER BY pa.orden, l.rowid`,
    )
    .all(pedidoId);
}

/** Devuelve el pedido con sus líneas o `null` si no existe. */
export function obtenerPedido(db, pedidoId) {
  const pedido = db
    .prepare(
      `SELECT *,
              (bloqueo_expira_en IS NOT NULL
                AND bloqueo_expira_en > datetime('now')) AS bloqueo_vigente
         FROM pedidos
        WHERE id = ?`,
    )
    .get(pedidoId);
  if (!pedido) return null;
  return { ...pedido, lineas: listarLineas(db, pedidoId) };
}

export function obtenerPedidoEnCursoPorMesa(db, mesaId) {
  return (
    db.prepare("SELECT * FROM pedidos WHERE mesa_id = ? AND estado = 'en_curso'").get(mesaId) ??
    null
  );
}

/** Pedido enviado más reciente de la mesa (el que alimenta la vista de sala 005). */
export function obtenerPedidoEnviadoPorMesa(db, mesaId) {
  return (
    db
      .prepare(
        `SELECT id, mesa_id, estado, enviado_en
           FROM pedidos
          WHERE mesa_id = ? AND estado = 'enviada'
          ORDER BY enviado_en DESC, rowid DESC
          LIMIT 1`,
      )
      .get(mesaId) ?? null
  );
}

/** Estado de cada línea del pedido, suficiente para calcular la completitud. */
export function listarEstadosDeLineas(db, pedidoId) {
  return db
    .prepare('SELECT id, estado FROM lineas_pedido WHERE pedido_id = ? ORDER BY rowid')
    .all(pedidoId);
}

/** Crea el pedido en curso de la mesa y la marca ocupada en una transacción. */
export function crearPedido(db, { mesaId, camareroId }) {
  const id = randomUUID();
  const crear = db.transaction(() => {
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES (?, ?, ?, 'en_curso')",
    ).run(id, mesaId, camareroId);
    marcarMesaOcupada(db, mesaId);
  });
  crear();
  return obtenerPedido(db, id);
}

export function obtenerLinea(db, lineaId) {
  return db.prepare(`SELECT ${LINEA_CAMPOS} ${LINEA_JOIN} WHERE l.id = ?`).get(lineaId) ?? null;
}

/** Añade una línea fijando el precio del plato en el momento de pedirlo (FR-018). */
export function anadirLinea(db, { pedidoId, plato, cantidad, indicaciones = null }) {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO lineas_pedido
       (id, pedido_id, plato_id, cantidad, precio_centimos, indicaciones)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(id, pedidoId, plato.id, cantidad, plato.precio_centimos, indicaciones);
  return obtenerLinea(db, id);
}

/** Modifica la cantidad y/o las indicaciones de una línea. */
export function modificarLinea(db, lineaId, { cantidad, indicaciones }) {
  if (cantidad !== undefined) {
    db.prepare('UPDATE lineas_pedido SET cantidad = ? WHERE id = ?').run(cantidad, lineaId);
  }
  if (indicaciones !== undefined) {
    db.prepare('UPDATE lineas_pedido SET indicaciones = ? WHERE id = ?').run(indicaciones, lineaId);
  }
  return obtenerLinea(db, lineaId);
}

export function retirarLinea(db, lineaId) {
  db.prepare('DELETE FROM lineas_pedido WHERE id = ?').run(lineaId);
}

/** Confirma el pedido: pasa a `enviada` y fija el momento de confirmación. */
export function confirmarPedido(db, pedidoId) {
  db.prepare(
    "UPDATE pedidos SET estado = 'enviada', enviado_en = datetime('now') WHERE id = ?",
  ).run(pedidoId);
  return obtenerPedido(db, pedidoId);
}

/**
 * Anula el pedido en curso: elimina el pedido y sus líneas (en cascada) y deja
 * la mesa libre, todo en la misma transacción (FR-019).
 */
export function anularPedido(db, pedidoId) {
  const pedido = db.prepare('SELECT mesa_id FROM pedidos WHERE id = ?').get(pedidoId);
  const anular = db.transaction(() => {
    db.prepare('DELETE FROM pedidos WHERE id = ?').run(pedidoId);
    liberarMesa(db, pedido.mesa_id);
  });
  anular();
  return pedido.mesa_id;
}

/* Edición de pedidos enviados (historia 002) */

/** Marca el pedido como modificado y con cambios pendientes de enviar. */
export function marcarModificado(db, pedidoId) {
  db.prepare(
    `UPDATE pedidos
        SET modificada = 1,
            cambios_pendientes = 1,
            modificado_en = datetime('now')
      WHERE id = ?`,
  ).run(pedidoId);
}

/** Marca los cambios como comunicados a cocina. */
export function marcarCambiosEnviados(db, pedidoId) {
  db.prepare(
    `UPDATE pedidos
        SET cambios_pendientes = 0,
            cambios_enviados_en = datetime('now')
      WHERE id = ?`,
  ).run(pedidoId);
}

/** Toma (o renueva) el bloqueo de edición del camarero durante `minutos`. */
export function actualizarBloqueo(db, pedidoId, camareroId, minutos) {
  db.prepare(
    `UPDATE pedidos
        SET editando_por = ?,
            editando_desde = datetime('now'),
            editando_ultima_actividad = datetime('now'),
            bloqueo_expira_en = datetime('now', ?)
      WHERE id = ?`,
  ).run(camareroId, `+${minutos} minutes`, pedidoId);
}

/** Refresca la última actividad y la expiración del bloqueo. */
export function renovarBloqueo(db, pedidoId, minutos) {
  db.prepare(
    `UPDATE pedidos
        SET editando_ultima_actividad = datetime('now'),
            bloqueo_expira_en = datetime('now', ?)
      WHERE id = ?`,
  ).run(`+${minutos} minutes`, pedidoId);
}

/** Libera el bloqueo de edición. */
export function limpiarBloqueo(db, pedidoId) {
  db.prepare(
    `UPDATE pedidos
        SET editando_por = NULL,
            editando_desde = NULL,
            editando_ultima_actividad = NULL,
            bloqueo_expira_en = NULL
      WHERE id = ?`,
  ).run(pedidoId);
}
