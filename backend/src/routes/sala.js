import express from 'express';
import { listarMesasAbiertasParaSala } from '../db/mesas.js';
import { obtenerInstantaneaSala } from '../services/salaMesas.js';
import { identificarCamarero } from '../middleware/camarero.js';

export function salaRouter(db) {
  const router = express.Router();

  router.use(identificarCamarero(db));

  router.get('/mesas', (req, res, next) => {
    try {
      listarMesasAbiertasParaSala(db);
      const instantanea = obtenerInstantaneaSala(db);
      res.json(instantanea);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
