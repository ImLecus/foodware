import { ErrorHttp } from '../middleware/error.js';
import { estadoBloqueo } from './edicion.js';

export const PARTIDAS = ['entrantes', 'principales', 'postres'];

/** Agrupa las líneas de un pedido por partida, conservando su orden. */
export function agruparPorPartida(lineas) {
  const grupos = { entrantes: [], principales: [], postres: [] };
  for (const linea of lineas) {
    if (grupos[linea.partida]) {
      grupos[linea.partida].push(linea);
    }
  }
  return grupos;
}

export function exigirMesa(mesa) {
  if (!mesa) {
    throw new ErrorHttp(404, 'Mesa no encontrada');
  }
  return mesa;
}

/** Una mesa cerrada no admite nuevas operaciones (FR-012). */
export function exigirMesaAbierta(mesa) {
  if (mesa.estado === 'cerrada') {
    throw new ErrorHttp(409, 'La mesa está cerrada');
  }
  return mesa;
}

export function exigirPedido(pedido) {
  if (!pedido) {
    throw new ErrorHttp(404, 'Pedido no encontrado');
  }
  return pedido;
}

/** Solo se puede modificar un pedido mientras está en curso. */
export function exigirEnCurso(pedido) {
  if (pedido.estado !== 'en_curso') {
    throw new ErrorHttp(409, 'El pedido ya no está en curso');
  }
  return pedido;
}

/** Una mesa no puede tener dos pedidos en curso a la vez (FR-005). */
export function exigirSinPedidoEnCurso(pedidoEnCurso) {
  if (pedidoEnCurso) {
    throw new ErrorHttp(409, 'La mesa ya tiene un pedido en curso');
  }
}

/** No se puede confirmar un pedido sin líneas (FR-014). */
export function exigirConfirmable(pedido) {
  exigirEnCurso(pedido);
  if (pedido.lineas.length === 0) {
    throw new ErrorHttp(409, 'No se puede confirmar un pedido vacío');
  }
  return pedido;
}

/** Solo se puede anular un pedido en curso (FR-019). */
export function exigirAnulable(pedido) {
  if (pedido.estado !== 'en_curso') {
    throw new ErrorHttp(409, 'Solo se puede anular un pedido en curso');
  }
  return pedido;
}

export function serializarLinea(linea) {
  return {
    id: linea.id,
    plato_id: linea.plato_id,
    plato_nombre: linea.plato_nombre,
    cantidad: linea.cantidad,
    precio_centimos: linea.precio_centimos,
    partida: linea.partida,
  };
}

export function serializarPedido(pedido) {
  const lineas = pedido.lineas.map(serializarLinea);
  return {
    id: pedido.id,
    mesa_id: pedido.mesa_id,
    camarero_id: pedido.camarero_id,
    estado: pedido.estado,
    creada_en: pedido.creado_en,
    confirmada_en: pedido.enviado_en,
    modificada: Boolean(pedido.modificada),
    cambios_pendientes: Boolean(pedido.cambios_pendientes),
    cambios_enviados_en: pedido.cambios_enviados_en ?? null,
    editando_por: pedido.editando_por ?? null,
    editando_desde: pedido.editando_desde ?? null,
    bloqueo_expira_en: pedido.bloqueo_expira_en ?? null,
    bloqueo: estadoBloqueo(pedido),
    lineas,
    por_partida: agruparPorPartida(lineas),
  };
}

/** Vista que se remite al resto del sistema al confirmar (FR-016). */
export function serializarPedidoConfirmado(pedido, mesa) {
  const lineas = pedido.lineas.map(serializarLinea);
  return {
    pedido_id: pedido.id,
    mesa: { id: mesa.id, identificador: mesa.identificador, estado: mesa.estado },
    confirmada_en: pedido.enviado_en,
    por_partida: agruparPorPartida(lineas),
  };
}
