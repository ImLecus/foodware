import express from 'express';
import { obtenerMesa } from '../db/mesas.js';
import {
  anadirLinea,
  anularPedido,
  confirmarPedido,
  modificarCantidadLinea,
  obtenerPedido,
  retirarLinea,
} from '../db/pedidos.js';
import { obtenerPlato } from '../db/platos.js';
import { adquirirBloqueoEdicion, estadoBloqueo, liberarBloqueoEdicion } from '../domain/edicion.js';
import {
  agruparPorPartida,
  exigirAnulable,
  exigirConfirmable,
  exigirEnCurso,
  exigirPedido,
  serializarPedido,
  serializarPedidoConfirmado,
} from '../domain/pedidos.js';
import { identificarCamarero } from '../middleware/camarero.js';
import { ErrorHttp } from '../middleware/error.js';
import { publicar } from '../realtime/hub.js';
import { validarLineaPatch, validarNuevaLinea } from '../schemas/pedidos.js';

function cargarPedidoEnCurso(db, pedidoId) {
  return exigirEnCurso(exigirPedido(obtenerPedido(db, pedidoId)));
}

function buscarLinea(pedido, lineaId) {
  const linea = pedido.lineas.find((fila) => fila.id === lineaId);
  if (!linea) {
    throw new ErrorHttp(404, 'Línea de pedido no encontrada');
  }
  return linea;
}

/** Pedido con las marcas de edición y el estado de su bloqueo. */
function conBloqueo(pedido) {
  return {
    ...serializarPedido(pedido),
    modificada: Boolean(pedido.modificada),
    cambios_pendientes: Boolean(pedido.cambios_pendientes),
    cambios_enviados_en: pedido.cambios_enviados_en,
    editando_por: pedido.editando_por,
    editando_desde: pedido.editando_desde,
    bloqueo_expira_en: pedido.bloqueo_expira_en,
    bloqueo: estadoBloqueo(pedido),
  };
}

export function pedidosRouter(db) {
  const router = express.Router();

  router.use(identificarCamarero(db));

  router.get('/:pedidoId', (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));
      res.json(serializarPedido(pedido));
    } catch (error) {
      next(error);
    }
  });

  router.post('/:pedidoId/editar', (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));
      adquirirBloqueoEdicion(db, pedido, req.camarero.id);
      res.json(conBloqueo(obtenerPedido(db, pedido.id)));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:pedidoId/editar', (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));
      liberarBloqueoEdicion(db, pedido, req.camarero.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.post('/:pedidoId/lineas', (req, res, next) => {
    try {
      const datos = validarNuevaLinea(req.body);
      const pedido = cargarPedidoEnCurso(db, req.params.pedidoId);
      const plato = obtenerPlato(db, datos.plato_id);

      if (!plato || !plato.disponible) {
        throw new ErrorHttp(400, 'El plato no está disponible en la carta');
      }

      const linea = anadirLinea(db, {
        pedidoId: pedido.id,
        plato,
        cantidad: datos.cantidad,
      });
      res.status(201).json(linea);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:pedidoId/lineas/:lineaId', (req, res, next) => {
    try {
      const datos = validarLineaPatch(req.body);
      const pedido = cargarPedidoEnCurso(db, req.params.pedidoId);
      const linea = buscarLinea(pedido, req.params.lineaId);
      res.json(modificarCantidadLinea(db, linea.id, datos.cantidad));
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:pedidoId/lineas/:lineaId', (req, res, next) => {
    try {
      const pedido = cargarPedidoEnCurso(db, req.params.pedidoId);
      const linea = buscarLinea(pedido, req.params.lineaId);
      retirarLinea(db, linea.id);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.post('/:pedidoId/confirmar', (req, res, next) => {
    try {
      const pedido = exigirConfirmable(exigirPedido(obtenerPedido(db, req.params.pedidoId)));
      const confirmado = confirmarPedido(db, pedido.id);
      const mesa = obtenerMesa(db, confirmado.mesa_id);

      publicar('pedido-confirmado', {
        pedidoId: confirmado.id,
        mesaId: confirmado.mesa_id,
        porPartida: agruparPorPartida(confirmado.lineas),
      });

      res.json(serializarPedidoConfirmado(confirmado, mesa));
    } catch (error) {
      next(error);
    }
  });

  router.post('/:pedidoId/anular', (req, res, next) => {
    try {
      const pedido = exigirAnulable(exigirPedido(obtenerPedido(db, req.params.pedidoId)));
      anularPedido(db, pedido.id);

      publicar('pedido-anulado', { pedidoId: pedido.id, mesaId: pedido.mesa_id });

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
}
