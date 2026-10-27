import express from 'express';
import { obtenerMesa } from '../db/mesas.js';
import {
  anadirLinea,
  anularPedido,
  confirmarPedido,
  limpiarBloqueo,
  marcarCambiosEnviados,
  modificarLinea,
  obtenerPedido,
  retirarLinea,
} from '../db/pedidos.js';
import { obtenerPlato } from '../db/platos.js';
import {
  adquirirBloqueoEdicion,
  estadoBloqueo,
  exigirBloqueoPropio,
  exigirCambiosPendientes,
  exigirEditable,
  exigirNoQuedaVacio,
  liberarBloqueoEdicion,
  registrarCambio,
} from '../domain/edicion.js';
import {
  agruparPorPartida,
  exigirAnulable,
  exigirConfirmable,
  exigirPedido,
  serializarPedido,
  serializarPedidoConfirmado,
} from '../domain/pedidos.js';
import { identificarCamarero } from '../middleware/camarero.js';
import { comprobarEdicion } from '../middleware/bloqueo.js';
import { ErrorHttp } from '../middleware/error.js';
import { publicar } from '../realtime/hub.js';
import { marcarLinea } from '../services/marcarListo.js';
import { validarLineaPatchEdicion, validarNuevaLineaEdicion } from '../schemas/edicion.js';

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

  router.put('/:pedidoId/lineas/:lineaId/estado', (req, res, next) => {
    try {
      const linea = marcarLinea(db, {
        pedidoId: req.params.pedidoId,
        lineaId: req.params.lineaId,
        estado: req.body?.estado,
        partida: req.query.partida,
      });
      res.json(linea);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:pedidoId/editar', (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));
      res.json(estadoBloqueo(pedido));
    } catch (error) {
      next(error);
    }
  });

  router.post('/:pedidoId/editar', (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));
      adquirirBloqueoEdicion(db, pedido, req.camarero.id);
      res.json(serializarPedido(obtenerPedido(db, pedido.id)));
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

  router.post('/:pedidoId/lineas', comprobarEdicion(db), (req, res, next) => {
    try {
      const datos = validarNuevaLineaEdicion(req.body);
      const pedido = req.pedido;
      const plato = obtenerPlato(db, datos.plato_id);

      if (!plato || !plato.disponible) {
        throw new ErrorHttp(400, 'El plato no está disponible en la carta');
      }

      const linea = anadirLinea(db, {
        pedidoId: pedido.id,
        plato,
        cantidad: datos.cantidad,
        indicaciones: datos.indicaciones ?? null,
      });

      if (pedido.estado === 'enviada') {
        registrarCambio(db, pedido, req.camarero.id, {
          tipo: 'anadir',
          lineaId: linea.id,
          detalle: {
            plato_id: plato.id,
            cantidad: datos.cantidad,
            indicaciones: datos.indicaciones ?? null,
          },
        });
      }

      res.status(201).json(linea);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:pedidoId/lineas/:lineaId', comprobarEdicion(db), (req, res, next) => {
    try {
      const datos = validarLineaPatchEdicion(req.body);
      const pedido = req.pedido;
      const linea = buscarLinea(pedido, req.params.lineaId);
      const actualizada = modificarLinea(db, linea.id, datos);

      if (pedido.estado === 'enviada') {
        if (datos.cantidad !== undefined) {
          registrarCambio(db, pedido, req.camarero.id, {
            tipo: 'ajustar_cantidad',
            lineaId: linea.id,
            detalle: { anterior: linea.cantidad, nueva: datos.cantidad },
          });
        }
        if (datos.indicaciones !== undefined) {
          registrarCambio(db, pedido, req.camarero.id, {
            tipo: 'corregir',
            lineaId: linea.id,
            detalle: { anterior: linea.indicaciones, nueva: datos.indicaciones },
          });
        }
      }

      res.json(actualizada);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:pedidoId/lineas/:lineaId', comprobarEdicion(db), (req, res, next) => {
    try {
      const pedido = req.pedido;
      const linea = buscarLinea(pedido, req.params.lineaId);
      exigirNoQuedaVacio(pedido.lineas.length - 1);
      retirarLinea(db, linea.id);

      if (pedido.estado === 'enviada') {
        registrarCambio(db, pedido, req.camarero.id, {
          tipo: 'retirar',
          detalle: {
            linea_id: linea.id,
            plato_id: linea.plato_id,
            cantidad: linea.cantidad,
          },
        });
      }

      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  router.post('/:pedidoId/enviar-cambios', (req, res, next) => {
    try {
      const pedido = exigirPedido(obtenerPedido(db, req.params.pedidoId));
      exigirEditable(pedido);
      exigirBloqueoPropio(pedido, req.camarero.id);
      exigirCambiosPendientes(pedido);

      marcarCambiosEnviados(db, pedido.id);
      limpiarBloqueo(db, pedido.id);
      const actualizado = obtenerPedido(db, pedido.id);
      const mesa = obtenerMesa(db, actualizado.mesa_id);
      const porPartida = agruparPorPartida(actualizado.lineas);

      publicar('pedido-modificado', {
        pedidoId: actualizado.id,
        mesaId: actualizado.mesa_id,
        modificada: true,
        porPartida,
      });

      res.json({
        pedido_id: actualizado.id,
        mesa: { id: mesa.id, identificador: mesa.identificador, estado: mesa.estado },
        modificada: true,
        por_partida: porPartida,
      });
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
