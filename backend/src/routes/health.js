import express from 'express';

export function healthRouter(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    db.prepare('SELECT 1').get();
    res.json({ estado: 'ok', servicio: 'foodware-backend' });
  });

  return router;
}
