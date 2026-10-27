import { publicar } from './hub.js';

export function emitirPedidoNuevo({ pedidoId, mesa, partida }) {
  publicar('pedido.nuevo', { tipo: 'pedido.nuevo', pedidoId, mesa, partida });
}

export function emitirPendientesCambiado({ partida }) {
  publicar('pedido.pendientes-cambiado', { tipo: 'pedido.pendientes-cambiado', partida });
}

export function emitirLineaActualizada({ pedidoId, lineaId, estado, listoEn, mesa, partida }) {
  publicar('linea.actualizada', {
    tipo: 'linea.actualizada',
    pedidoId,
    lineaId,
    estado,
    listoEn: listoEn ?? null,
    mesa,
    partida,
  });
}

export function emitirPedidoModificado({ pedidoId, partida, modificadoEn, mesa }) {
  publicar('pedido.modificado', {
    tipo: 'pedido.modificado',
    pedidoId,
    partida,
    modificado: true,
    modificadoEn,
    mesa,
  });
}

export function emitirPedidoReabierto({ pedidoId, partida, mesa, lineaId }) {
  publicar('pedido.reabierto', {
    tipo: 'pedido.reabierto',
    pedidoId,
    partida,
    mesa,
    lineaId,
  });
}

export function emitirAvisoActivo({ avisoId, mesaId, generadoEn }) {
  publicar('aviso.activo', {
    aviso_id: avisoId,
    mesa_id: mesaId,
    generado_en: generadoEn,
  });
}

export function emitirAvisoRetirado({ mesaId }) {
  publicar('aviso.retirado', { mesa_id: mesaId });
}

export function emitirAvisoDescartado({ avisoId, mesaId, descartadoEn }) {
  publicar('aviso.descartado', {
    aviso_id: avisoId,
    mesa_id: mesaId,
    descartado_en: descartadoEn,
  });
}
