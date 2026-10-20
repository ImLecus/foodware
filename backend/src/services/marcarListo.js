import {
  actualizarEstadoLinea,
  buscarLineaDePedido,
  contarLineasPendientes,
} from '../models/lineaPedido.js';
import { buscarPedido } from '../models/pedido.js';
import { ErrorHttp } from '../middleware/error.js';
import { aISO } from '../utils/fechas.js';

function respuestaLinea(linea, { pedidoCompletado = false, pedidoReabierto = false } = {}) {
  return {
    id: linea.id,
    pedidoId: linea.pedidoId,
    nombrePlato: linea.nombrePlato,
    cantidad: linea.cantidad,
    estado: linea.estado,
    listoEn: aISO(linea.listoEn),
    pedidoCompletado,
    pedidoReabierto,
  };
}

/**
 * Asignación idempotente del estado de una línea de pedido.
 * `listo` fija `listoEn` una sola vez; `pendiente` lo limpia.
 */
export function marcarLinea(db, { pedidoId, lineaId, estado, partida }) {
  if (estado !== 'listo' && estado !== 'pendiente') {
    throw new ErrorHttp(400, 'El estado debe ser listo o pendiente', 'estado_invalido');
  }

  const pedido = buscarPedido(db, pedidoId);
  if (!pedido) {
    throw new ErrorHttp(404, 'El pedido no existe', 'pedido_no_encontrado');
  }

  const linea = buscarLineaDePedido(db, pedidoId, lineaId);
  if (!linea) {
    throw new ErrorHttp(404, 'La línea no pertenece al pedido', 'linea_no_encontrada');
  }

  if (partida && linea.partida !== partida) {
    throw new ErrorHttp(403, 'La línea no pertenece a tu partida', 'partida_ajena');
  }

  const pendientesAntes = contarLineasPendientes(db, pedidoId);

  if (estado === 'listo') {
    if (pedido.estado !== 'enviada' || pendientesAntes === 0) {
      throw new ErrorHttp(409, 'El pedido ya está completado', 'pedido_completado');
    }

    if (linea.estado === 'listo') {
      return respuestaLinea(linea, { pedidoCompletado: false });
    }

    const listoEn = new Date().toISOString();
    actualizarEstadoLinea(db, lineaId, 'listo', listoEn);
    const pendientesDespues = contarLineasPendientes(db, pedidoId);
    return respuestaLinea(
      { ...linea, estado: 'listo', listoEn },
      { pedidoCompletado: pendientesDespues === 0 },
    );
  }

  if (linea.estado === 'pendiente') {
    return respuestaLinea(linea);
  }

  if (pendientesAntes === 0) {
    throw new ErrorHttp(
      409,
      'No se puede deshacer una marca de un pedido completado',
      'pedido_completado',
    );
  }

  actualizarEstadoLinea(db, lineaId, 'pendiente', null);
  return respuestaLinea({ ...linea, estado: 'pendiente', listoEn: null });
}
