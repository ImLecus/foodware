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

export function emitirAvisoActivo({ avisoId, mesaId, generadoEn }) {
  publicar('aviso.activo', {
    aviso_id: avisoId,
    mesa_id: mesaId,
    generado_en: generadoEn,
  });
}

export function emitirAvisoRetirado({ avisoId, mesaId }) {
  publicar('aviso.retirado', {
    aviso_id: avisoId,
    mesa_id: mesaId,
  });
}

export function emitirAvisoDescartado({ avisoId, mesaId, descartadoEn }) {
  publicar('aviso.descartado', {
    aviso_id: avisoId,
    mesa_id: mesaId,
    descartado_en: descartadoEn,
  });
}
