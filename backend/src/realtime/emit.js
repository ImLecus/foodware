import { publicar } from './hub.js';

export function emitirPedidoNuevo({ pedidoId, mesa, mesaId, partida }) {
  publicar('pedido.nuevo', { tipo: 'pedido.nuevo', pedidoId, mesa, mesaId, partida });
}

export function emitirPendientesCambiado({ partida, mesaId }) {
  publicar('pedido.pendientes-cambiado', {
    tipo: 'pedido.pendientes-cambiado',
    partida,
    ...(mesaId ? { mesaId } : {}),
  });
}

export function emitirLineaActualizada({
  pedidoId,
  lineaId,
  estado,
  listoEn,
  mesa,
  mesaId,
  partida,
  nombrePlato,
  cantidad,
}) {
  const linea = {
    id: lineaId,
    nombrePlato,
    cantidad,
    estado,
    listoEn: listoEn ?? null,
  };

  publicar('linea.actualizada', {
    tipo: 'linea.actualizada',
    pedidoId,
    lineaId,
    estado,
    listoEn: linea.listoEn,
    mesa,
    mesaId,
    partida,
    linea,
  });
}

export function emitirPedidoModificado({ pedidoId, partida, modificadoEn, mesa, mesaId }) {
  publicar('pedido.modificado', {
    tipo: 'pedido.modificado',
    pedidoId,
    partida,
    modificado: true,
    modificadoEn,
    mesa,
    mesaId,
  });
}

export function emitirPedidoReabierto({ pedidoId, partida, mesa, mesaId, lineaId }) {
  publicar('pedido.reabierto', {
    tipo: 'pedido.reabierto',
    pedidoId,
    partida,
    mesa,
    mesaId,
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
