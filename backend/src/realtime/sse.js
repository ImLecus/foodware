import { publicar, suscribir } from './hub.js';

/** Suscribe una respuesta al canal SSE de una partida. */
export function suscribirAPartida(req, res, partidaId) {
  suscribir(req, res, partidaId);
}

/** Difunde un evento de cocina a sus canales. */
export function publicarEventoCocina(evento, datos) {
  publicar(evento, datos);
}
