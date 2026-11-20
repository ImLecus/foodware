import express from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { requireRole } from '../middleware/authorize.js';
import { validarCierreUnico, validarDivision } from '../schemas/cuentas.js';
import {
  cerrarCuentaUnica,
  confirmarDivision,
  deshacerPagoParte,
  obtenerCuenta,
  obtenerTicket,
  pagarParte,
} from '../services/cuentasService.js';

export function cuentasRouter(db) {
  const router = express.Router();

  router.use(autenticar(db), requireRole('camarero'));

  router.get('/mesas/:mesaId/cuenta', (req, res, next) => {
    try {
      res.json(obtenerCuenta(db, req.params.mesaId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/mesas/:mesaId/cuenta/ticket', (req, res, next) => {
    try {
      res.json(obtenerTicket(db, req.params.mesaId));
    } catch (error) {
      if (error.codigo === 'ticket_no_emitido') {
        res.status(409).json({
          error: error.message,
          codigo: error.codigo,
          ticket_estado: 'no_emitido',
        });
        return;
      }
      next(error);
    }
  });

  router.post('/mesas/:mesaId/cuenta/cierre', (req, res, next) => {
    try {
      const datos = validarCierreUnico(req.body);
      const resultado = cerrarCuentaUnica(db, req.params.mesaId, {
        totalBaseCentimos: datos.total_base_centimos,
        camareroId: req.camarero.id,
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

  router.post('/mesas/:mesaId/cuenta/partes/:parteId/pago', (req, res, next) => {
    try {
      res.json(
        pagarParte(db, req.params.mesaId, req.params.parteId, { camareroId: req.camarero.id }),
      );
    } catch (error) {
      next(error);
    }
  });

  router.delete('/mesas/:mesaId/cuenta/partes/:parteId/pago', (req, res, next) => {
    try {
      res.json(deshacerPagoParte(db, req.params.mesaId, req.params.parteId));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
