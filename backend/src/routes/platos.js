import express from 'express';
import { listarPlatosDisponibles } from '../db/platos.js';
import { identificarCamarero } from '../middleware/camarero.js';

export function platosRouter(db) {
  const router = express.Router();

  router.use(identificarCamarero(db));

  router.get('/', (req, res) => {
    res.json(listarPlatosDisponibles(db));
  });

  return router;
}
