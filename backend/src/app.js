import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { manejadorErrores, noEncontrado } from './middleware/error.js';
import { crearReportsRouter } from './api/reportsRouter.js';
import { cocinerosRouter } from './routes/cocineros.js';
import { eventsRouter } from './routes/events.js';
import { healthRouter } from './routes/health.js';
import { mesasRouter } from './routes/mesas.js';
import { partidasRouter } from './routes/partidas.js';
import { pedidosRouter } from './routes/pedidos.js';
import { platosRouter } from './routes/platos.js';
import { salaRouter } from './routes/sala.js';
import { crearApiRouter } from './api/index.js';

/**
 * Construye la aplicación Express. Recibe la conexión a la base de datos
 * para poder usar ':memory:' en las pruebas.
 */
export function createApp(db) {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.locals.db = db;

  app.use('/api/health', healthRouter(db));
  app.use('/api/eventos', eventsRouter);
  app.use('/api/cocineros', cocinerosRouter(db));
  app.use('/api/partidas', partidasRouter(db));
  app.use('/api/mesas', mesasRouter(db));
  app.use('/api/platos', platosRouter(db));
  app.use('/api/pedidos', pedidosRouter(db));
  app.use('/api/reports', crearReportsRouter(db));
  app.use('/api/sala', salaRouter(db));
  app.use('/api', crearApiRouter(db));

  app.use(noEncontrado);
  app.use(manejadorErrores);

  return app;
}
