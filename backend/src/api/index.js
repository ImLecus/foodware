import express from 'express';
import { CartaService } from '../services/cartaService.js';
import { crearCartaAdminRouter } from './cartaAdminRouter.js';
import { crearCartaRouter } from './cartaRouter.js';

export function crearApiRouter(db) {
  const router = express.Router();
  const cartaService = new CartaService(db);

  router.use('/admin/platos', crearCartaAdminRouter(db, cartaService));
  router.use('/carta', crearCartaRouter(db, cartaService));
  router.use('/admin/ingredientes', (await import('./cartaIngredientesRouter.js')).crearCartaIngredientesRouter(db));

  return router;
}

export default crearApiRouter;
