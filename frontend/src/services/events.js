import { crearConexionEventos } from './realtime.js';

export const EVENTOS_COCINA = [
  'pedido.nuevo',
  'pedido.pendientes-cambiado',
  'linea.actualizada',
  'pedido.modificado',
];

/**
 * Suscribe la vista de cocina al canal SSE de su partida.
 * Devuelve la función para cerrar la conexión.
 */
export function suscribirAPartida(partidaId, { onEvento, onEstadoConexion } = {}) {
  const conexion = crearConexionEventos(partidaId);

  conexion.addEventListener('open', () => onEstadoConexion?.('conectado'));
  conexion.addEventListener('error', () => onEstadoConexion?.('sin-conexion'));

  for (const nombre of EVENTOS_COCINA) {
    conexion.addEventListener(nombre, (evento) => {
      let datos = {};
      try {
        datos = JSON.parse(evento.data);
      } catch {
        // El evento puede venir sin datos JSON.
      }
      onEvento?.(nombre, datos);
    });
  }

  return () => conexion.close();
}
