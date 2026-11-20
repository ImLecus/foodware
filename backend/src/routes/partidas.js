import express from 'express';
import { existePartida } from '../models/partida.js';
import { autenticar } from '../middleware/autenticar.js';
import { requireRole } from '../middleware/authorize.js';
import { ErrorHttp } from '../middleware/error.js';
import { suscribirAPartida } from '../realtime/sse.js';
import { listarPedidosPendientes } from '../services/verPedidos.js';

function exigirPartidaDelCocinero(req) {
  const { partidaId } = req.params;

  if (req.usuario.partida !== partidaId) {
    throw new ErrorHttp(403, 'No tienes acceso a esta partida', 'partida_ajena');
  }
}

export function partidasRouter(db) {
  const router = express.Router();

  router.use(autenticar(db), requireRole('cocinero'));

  router.get('/:partidaId/eventos', (req, res, next) => {
    try {
      const { partidaId } = req.params;
      if (!existePartida(db, partidaId)) {
        throw new ErrorHttp(404, 'La partida indicada no existe', 'partida_no_encontrada');
      }
      exigirPartidaDelCocinero(req);

      return suscribirAPartida(req, res, partidaId);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/:partidaId/pedidos-pendientes', (req, res, next) => {
    try {
      const { partidaId } = req.params;
      if (!existePartida(db, partidaId)) {
        throw new ErrorHttp(404, 'La partida indicada no existe', 'partida_no_encontrada');
      }
      exigirPartidaDelCocinero(req);

      return res.json(listarPedidosPendientes(db, partidaId));
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
