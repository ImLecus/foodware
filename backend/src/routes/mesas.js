import express from 'express';
import { listarMesas, obtenerMesa } from '../db/mesas.js';
import { crearPedido, obtenerPedidoEnCursoPorMesa } from '../db/pedidos.js';
import { exigirMesa, exigirSinPedidoEnCurso, serializarPedido } from '../domain/pedidos.js';
import { identificarCamarero } from '../middleware/camarero.js';
import { ErrorHttp } from '../middleware/error.js';

export function mesasRouter(db) {
  const router = express.Router();

  router.use(identificarCamarero(db));

  router.get('/', (req, res) => {
    res.json(listarMesas(db));
  });

  router.post('/:mesaId/abrir', (req, res, next) => {
    try {
      const mesa = exigirMesa(obtenerMesa(db, req.params.mesaId));
      exigirSinPedidoEnCurso(obtenerPedidoEnCursoPorMesa(db, mesa.id));

      const pedido = crearPedido(db, { mesaId: mesa.id, camareroId: req.camarero.id });
      res.status(201).json(serializarPedido(pedido));
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.code === 'SQLITE_CONSTRAINT') {
        next(new ErrorHttp(409, 'La mesa ya tiene un pedido en curso'));
        return;
      }
      next(error);
    }
  });

  return router;
}
