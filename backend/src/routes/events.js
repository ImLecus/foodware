import express from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { suscribir } from '../realtime/hub.js';

export function eventsRouter(db) {
  const router = express.Router();

  router.use(autenticar(db));

  router.get('/', (req, res) => {
    suscribir(req, res);
  });

  return router;
}
