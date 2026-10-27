import { crearConexionEventos, crearConexionEventosMesa } from './realtime.js';

export const EVENTOS_COCINA = [
  'pedido.nuevo',
  'pedido.pendientes-cambiado',
  'linea.actualizada',
  'pedido.modificado',
  'pedido.reabierto',
  // Eventos publicados por las historias 001 y 002 con su nomenclatura original.
  'pedido-confirmado',
  'pedido-modificado',
  'pedido-anulado',
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

const EVENTOS_SALA = [
  'linea.actualizada',
  'pedido.reabierto',
  'pedido.pendientes-cambiado',
  'pedido.modificado',
  'pedido-modificado',
  'pedido-confirmado',
];

/** Suscripción de la pantalla de sala al estado de los platos de una mesa. */
export function suscribirSala({ mesaId, onEvento, onEstadoConexion } = {}) {
  const conexion = mesaId ? crearConexionEventosMesa(mesaId) : crearConexionEventos();

  conexion.addEventListener('open', () => onEstadoConexion?.('conectado'));
  conexion.addEventListener('error', () => onEstadoConexion?.('sin-conexion'));

  for (const nombre of EVENTOS_SALA) {
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
