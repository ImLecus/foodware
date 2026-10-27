import express from 'express';
import { identificarCamarero } from '../middleware/camarero.js';
import { validarCierreUnico } from '../schemas/cuentas.js';
import { cerrarCuentaUnica, obtenerCuenta } from '../services/cuentasService.js';

export function cuentasRouter(db) {
  const router = express.Router();

  router.use(identificarCamarero(db));

  router.get('/mesas/:mesaId/cuenta', (req, res, next) => {
    try {
      res.json(obtenerCuenta(db, req.params.mesaId));
    } catch (error) {
      next(error);
    }
  });

  router.post('/mesas/:mesaId/cuenta/cierre', (req, res, next) => {
    try {
      const datos = validarCierreUnico(req.body);
      const resultado = cerrarCuentaUnica(db, req.params.mesaId, {
        totalBaseCentimos: datos.total_base_centimos,
      });
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
