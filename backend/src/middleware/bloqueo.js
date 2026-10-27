import { obtenerMesa } from '../db/mesas.js';
import { limpiarBloqueo, obtenerPedido } from '../db/pedidos.js';
import { estadoBloqueo, exigirBloqueoPropio, exigirEditable } from '../domain/edicion.js';
import { exigirMesa, exigirMesaAbierta, exigirPedido } from '../domain/pedidos.js';
import { ErrorHttp } from './error.js';

/**
 * Comprueba que el camarero puede modificar las líneas del pedido:
 * - `cerrada` u otros estados de la mesa: no admite cambios (FR-012).
 * - `en_curso`: se permite (flujo de la historia 001, sin bloqueo).
 * - `enviada`: se exige el bloqueo de edición del propio camarero.
 * La caducidad del bloqueo se evalúa y limpia de forma perezosa.
 */
export function comprobarEdicion(db) {
  return (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));
      exigirMesaAbierta(exigirMesa(obtenerMesa(db, pedido.mesa_id)));

      if (pedido.estado === 'en_curso') {
        req.pedido = pedido;
        next();
        return;
      }

      exigirEditable(pedido);

      if (estadoBloqueo(pedido).estado === 'expirado') {
        limpiarBloqueo(db, pedido.id);
      }

      exigirBloqueoPropio(pedido, req.camarero.id);
      req.pedido = pedido;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Utilidad para respuestas 404 de pedidos. */
export function pedidoNoEncontrado() {
  return new ErrorHttp(404, 'Pedido no encontrado');
}
