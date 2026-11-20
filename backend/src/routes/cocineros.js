import express from 'express';
import { buscarCocinero } from '../models/usuario.js';
import { autenticar } from '../middleware/autenticar.js';
import { requireRole } from '../middleware/authorize.js';
import { ErrorHttp } from '../middleware/error.js';

export function cocinerosRouter(db) {
  const router = express.Router();

  router.use(autenticar(db), requireRole('cocinero'));

  router.get('/:cocineroId', (req, res, next) => {
    try {
      const cocinero = buscarCocinero(db, req.params.cocineroId);
      if (!cocinero) {
        throw new ErrorHttp(404, 'El cocinero indicado no existe', 'cocinero_no_encontrado');
      }

      if (req.params.cocineroId !== req.usuario.id) {
        throw new ErrorHttp(403, 'Solo puedes consultar tu propio perfil', 'cocinero_ajeno');
      }

      return res.json(cocinero);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
