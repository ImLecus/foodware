import express from 'express';
import { identificarCamarero } from '../middleware/camarero.js';
import { validarCierreUnico, validarDivision } from '../schemas/cuentas.js';
import {
  cerrarCuentaUnica,
  confirmarDivision,
  obtenerCuenta,
} from '../services/cuentasService.js';

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

  router.post('/mesas/:mesaId/cuenta/division', (req, res, next) => {
    try {
      const datos = validarDivision(req.body);
      const resultado = confirmarDivision(db, req.params.mesaId, {
        modo: datos.modo,
        totalBaseCentimos: datos.total_base_centimos,
        partes: datos.partes,
        asignaciones: datos.asignaciones,
      });
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
