import { ErrorHttp } from '../middleware/error.js';
import { emitirLineaActualizada } from '../realtime/emit.js';

export function cambiarEstadoLinea(db, { pedidoId, lineaId, estado }) {
  const pedido = db.prepare('SELECT id, estado, mesa_id FROM pedidos WHERE id = ?').get(pedidoId);

  if (!pedido) {
    throw new ErrorHttp(404, 'Pedido no encontrado');
  }

  if (pedido.estado !== 'enviada') {
    throw new ErrorHttp(409, 'Solo se puede marcar el estado de los platos de un pedido enviado');
  }

  const linea = db
    .prepare('SELECT id, pedido_id FROM lineas_pedido WHERE id = ? AND pedido_id = ?')
    .get(lineaId, pedidoId);

  if (!linea) {
    throw new ErrorHttp(404, 'Línea de pedido no encontrada');
  }

  if (estado === 'listo') {
    db.prepare("UPDATE lineas_pedido SET estado = 'listo', listo_en = datetime('now') WHERE id = ?").run(
      lineaId,
    );
  } else {
    db.prepare("UPDATE lineas_pedido SET estado = 'pendiente', listo_en = NULL WHERE id = ?").run(
      lineaId,
    );
  }

  emitirLineaActualizada({ pedidoId, lineaId, estado });

  const lineaActualizada = db
    .prepare('SELECT id, estado, listo_en FROM lineas_pedido WHERE id = ?')
    .get(lineaId);

  return {
    linea_id: lineaId,
    pedido_id: pedidoId,
    mesa_id: pedido.mesa_id,
    estado: lineaActualizada.estado,
    marcado_en: lineaActualizada.listo_en
      ? new Date(`${lineaActualizada.listo_en.replace(' ', 'T')}Z`).toISOString()
      : null,
  };
}
