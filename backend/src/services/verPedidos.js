import { listarLineasDePedido } from '../models/lineaPedido.js';
import { numeroDeMesa } from '../models/mesa.js';
import { listarPedidosConPendientes } from '../models/pedido.js';
import { logger } from '../config/logger.js';
import { aISO } from '../utils/fechas.js';

/**
 * Lista de pedidos pendientes de una partida con la forma del contrato
 * (contracts/openapi.yaml, PedidoCocina).
 */
export function listarPedidosPendientes(db, partidaId) {
  const pedidos = listarPedidosConPendientes(db, partidaId);
  logger.info('Listado de pedidos pendientes', { partidaId, total: pedidos.length });

  return pedidos.map((pedido) => {
    const lineas = listarLineasDePedido(db, pedido.id);
    const tienePendientes = lineas.some((linea) => linea.estado === 'pendiente');

    return {
      id: pedido.id,
      mesa: numeroDeMesa(pedido.mesa_identificador),
      partida: partidaId,
      enviadoEn: aISO(pedido.enviado_en),
      modificadoEn: aISO(pedido.modificado_en),
      modificado: Boolean(pedido.modificado_en),
      estado: tienePendientes ? 'pendiente' : 'completado',
      lineas: lineas.map((linea) => ({
        id: linea.id,
        nombrePlato: linea.nombre_plato,
        cantidad: linea.cantidad,
        estado: linea.estado,
        listoEn: aISO(linea.listo_en),
      })),
    };
  });
}
