import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { manejadorErrores, noEncontrado } from './middleware/error.js';
import { eventsRouter } from './routes/events.js';
import { healthRouter } from './routes/health.js';
import { mesasRouter } from './routes/mesas.js';

/**
 * Construye la aplicación Express. Recibe la conexión a la base de datos
 * para poder usar ':memory:' en las pruebas.
 */
export function createApp(db) {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/api/health', healthRouter(db));
  app.use('/api/eventos', eventsRouter);
  app.use('/api/mesas', mesasRouter(db));

  app.use(noEncontrado);
  app.use(manejadorErrores);

  return app;
}
