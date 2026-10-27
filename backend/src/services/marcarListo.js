import {
  actualizarEstadoLinea,
  buscarLineaDePedido,
  contarLineasPendientes,
} from '../models/lineaPedido.js';
import { buscarMesa, numeroDeMesa } from '../models/mesa.js';
import { buscarPedido } from '../models/pedido.js';
import { ErrorHttp } from '../middleware/error.js';
import { logger } from '../config/logger.js';
import {
  emitirLineaActualizada,
  emitirPedidoReabierto,
  emitirPendientesCambiado,
} from '../realtime/emit.js';
import { sincronizarAvisoMesa } from './avisos.js';
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

  const mesa = buscarMesa(db, pedido.mesa_id);
  const mesaNumero = numeroDeMesa(mesa?.identificador);
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
    const respuesta = respuestaLinea(
      { ...linea, estado: 'listo', listoEn },
      { pedidoCompletado: pendientesDespues === 0 },
    );

    emitirLineaActualizada({
      pedidoId,
      lineaId,
      estado: 'listo',
      listoEn: respuesta.listoEn,
      mesa: mesaNumero,
      partida: linea.partida,
    });
    respuesta.mesa = sincronizarAvisoMesa(db, pedido.mesa_id, { nuevoPlatoListo: true });
    if (respuesta.pedidoCompletado) {
      emitirPendientesCambiado({ partida: linea.partida });
    }
    logger.info('Línea marcada como lista', {
      pedidoId,
      lineaId,
      pedidoCompletado: respuesta.pedidoCompletado,
    });

    return respuesta;
  }

  if (linea.estado === 'pendiente') {
    return respuestaLinea(linea);
  }

  actualizarEstadoLinea(db, lineaId, 'pendiente', null);
  const respuesta = respuestaLinea(
    { ...linea, estado: 'pendiente', listoEn: null },
    { pedidoReabierto: pendientesAntes === 0 },
  );

  emitirLineaActualizada({
    pedidoId,
    lineaId,
    estado: 'pendiente',
    listoEn: null,
    mesa: mesaNumero,
    partida: linea.partida,
  });
  respuesta.mesa = sincronizarAvisoMesa(db, pedido.mesa_id);
  if (respuesta.pedidoReabierto) {
    emitirPendientesCambiado({ partida: linea.partida });
    emitirPedidoReabierto({
      pedidoId,
      partida: linea.partida,
      mesa: mesaNumero,
      lineaId,
    });
  }
  logger.info('Línea devuelta a pendiente', {
    pedidoId,
    lineaId,
    pedidoReabierto: respuesta.pedidoReabierto,
  });

  return respuesta;
}
