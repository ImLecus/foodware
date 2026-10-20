import express from 'express';
import { obtenerMesa } from '../db/mesas.js';
import {
  anadirLinea,
  confirmarPedido,
  modificarCantidadLinea,
  obtenerPedido,
  retirarLinea,
} from '../db/pedidos.js';
import { obtenerPlato } from '../db/platos.js';
import {
  exigirConfirmable,
  exigirEnCurso,
  exigirPedido,
  serializarPedido,
  serializarPedidoConfirmado,
} from '../domain/pedidos.js';
import { identificarCamarero } from '../middleware/camarero.js';
import { ErrorHttp } from '../middleware/error.js';
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
        platoId: plato.id,
        cantidad: datos.cantidad,
        precioCentimos: plato.precio_centimos,
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

      res.json(serializarPedidoConfirmado(confirmado, mesa));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
