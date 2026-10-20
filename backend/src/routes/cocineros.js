import express from 'express';
import { buscarCocinero } from '../models/usuario.js';

export function cocinerosRouter(db) {
  const router = express.Router();

  router.get('/:cocineroId', (req, res) => {
    const cocinero = buscarCocinero(db, req.params.cocineroId);

    if (!cocinero) {
      return res.status(404).json({
        codigo: 'cocinero_no_encontrado',
        mensaje: 'El cocinero indicado no existe',
      });
    }

    return res.json(cocinero);
  });

  return router;
}
