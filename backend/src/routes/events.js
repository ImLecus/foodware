import express from 'express';
import { suscribir } from '../realtime/hub.js';

export const eventsRouter = express.Router();

eventsRouter.get('/', (req, res) => {
  suscribir(req, res);
});
