import express from 'express';

export function crearCartaRouter(db, cartaService) {
  const router = express.Router();

  router.get('/', (req, res) => {
    try {
      const carta = cartaService.obtenerCartaAgrupada
        ? cartaService.obtenerCartaAgrupada()
        : cartaService.obtenerCartaVigente
        ? cartaService.obtenerCartaVigente()
        : [];
      res.json(carta);
    } catch (e) {
      res.status(500).json({ error: 'Error interno' });
    }
  });

  return router;
}
