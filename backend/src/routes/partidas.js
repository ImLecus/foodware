import express from 'express';
import { existePartida } from '../models/partida.js';
import { listarPedidosPendientes } from '../services/verPedidos.js';

export function partidasRouter(db) {
  const router = express.Router();

  router.get('/:partidaId/pedidos-pendientes', (req, res) => {
    const { partidaId } = req.params;

    if (!existePartida(db, partidaId)) {
      return res.status(404).json({
        codigo: 'partida_no_encontrada',
        mensaje: 'La partida indicada no existe',
      });
    }

    return res.json(listarPedidosPendientes(db, partidaId));
  });

  return router;
}
