import { publicar, suscribir } from './hub.js';

/** Suscribe una respuesta al canal SSE de una partida. */
export function suscribirAPartida(req, res, partidaId) {
  suscribir(req, res, { partida: partidaId });
}

/** Suscribe una respuesta al canal SSE de una mesa. */
export function suscribirAMesa(req, res, mesaId) {
  suscribir(req, res, { mesaId });
}

/** Difunde un evento de cocina a sus canales. */
export function publicarEventoCocina(evento, datos) {
  publicar(evento, datos);
}
