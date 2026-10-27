import express from 'express';
import { listarPlatosDisponibles } from '../db/platos.js';
import { autenticar } from '../middleware/autenticar.js';
import { requireRole } from '../middleware/authorize.js';

export function platosRouter(db) {
  const router = express.Router();

  router.use(autenticar(db), requireRole('camarero'));

  router.get('/', (req, res) => {
    res.json(listarPlatosDisponibles(db));
  });

  return router;
}
