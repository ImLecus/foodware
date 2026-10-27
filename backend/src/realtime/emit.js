import { publicar } from './hub.js';

export function emitirPedidoNuevo({ pedidoId, mesa, partida }) {
  publicar('pedido.nuevo', { pedidoId, mesa, partida });
}

export function emitirPendientesCambiado({ partida }) {
  publicar('pedido.pendientes-cambiado', { partida });
}

export function emitirLineaActualizada({ pedidoId, lineaId, estado }) {
  publicar('linea.actualizada', { pedidoId, lineaId, estado });
}

export function emitirPedidoModificado({ pedidoId, partida, modificadoEn }) {
  publicar('pedido.modificado', { pedidoId, partida, modificadoEn });
}

export function emitirPedidoReabierto({ pedidoId, partida }) {
  publicar('pedido.reabierto', { pedidoId, partida });
}
