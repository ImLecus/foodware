import { publicar, suscribir } from './hub.js';

/** Suscribe una respuesta al canal SSE de cocina. */
export function suscribirAPartida(req, res) {
  suscribir(req, res);
}

/** Difunde un evento de cocina a todos los clientes conectados. */
export function publicarEventoCocina(evento, datos) {
  publicar(evento, datos);
}
