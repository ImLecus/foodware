import express from 'express';
import { cambiarEstadoLinea } from '../services/estadoLinea.js';
import { esquemaCambioEstadoLinea } from '../schemas/estadoLinea.js';
import { identificarCamarero } from '../middleware/camarero.js';
import { ErrorHttp } from '../middleware/error.js';
import { obtenerInstantaneaSala } from '../services/salaMesas.js';

export function lineasRouter(db) {
  const router = express.Router();

  router.use(identificarCamarero(db));

  router.put('/:pedidoId/lineas/:lineaId/estado', (req, res, next) => {
    try {
      const parsed = esquemaCambioEstadoLinea.safeParse(req.body);

      if (!parsed.success) {
        throw new ErrorHttp(400, 'El estado debe ser pendiente o listo');
      }

      const resultado = cambiarEstadoLinea(db, {
        pedidoId: req.params.pedidoId,
        lineaId: req.params.lineaId,
        estado: parsed.data.estado,
      });

      const instantanea = obtenerInstantaneaSala(db);
      const mesa = instantanea.mesas.find((m) => m.id === resultado.mesa_id);

      res.json({
        ...resultado,
        mesa: mesa ? { completa: mesa.completa, aviso: mesa.aviso } : { completa: false, aviso: null },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
