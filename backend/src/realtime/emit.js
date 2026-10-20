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
