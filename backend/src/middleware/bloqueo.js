import { limpiarBloqueo, obtenerPedido } from '../db/pedidos.js';
import { estadoBloqueo, exigirBloqueoPropio, exigirEditable } from '../domain/edicion.js';
import { exigirPedido } from '../domain/pedidos.js';
import { ErrorHttp } from './error.js';

/**
 * Comprueba que el camarero puede modificar las líneas del pedido:
 * - `en_curso`: se permite (flujo de la historia 001, sin bloqueo).
 * - `enviada`: se exige el bloqueo de edición del propio camarero.
 * - `cerrada` u otros estados: no admite cambios.
 * La caducidad del bloqueo se evalúa y limpia de forma perezosa.
 */
export function comprobarEdicion(db) {
  return (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));

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
