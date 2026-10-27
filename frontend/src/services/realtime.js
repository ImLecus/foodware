import { API_BASE } from './api.js';

/**
 * Abre el canal SSE compartido. EventSource reconecta solo; la vista
 * debe reaccionar a los eventos 'open' y 'error'.
 */
export function crearConexionEventos(partidaId) {
  const ruta = partidaId ? `/partidas/${encodeURIComponent(partidaId)}/eventos` : '/eventos';
  return new EventSource(`${API_BASE}${ruta}`);
}

/** Abre el canal SSE de una mesa para la pantalla de sala. */
export function crearConexionEventosMesa(mesaId) {
  return new EventSource(`${API_BASE}/mesas/${encodeURIComponent(mesaId)}/eventos`);
}

/**
 * Suscribe la vista de sala 005 al canal SSE compartido.
 */
export function suscribirASala({ onEvento, onEstadoConexion } = {}) {
  const conexion = crearConexionEventos(null);

  conexion.addEventListener('open', () => onEstadoConexion?.('conectado'));
  conexion.addEventListener('error', () => onEstadoConexion?.('sin-conexion'));

  const eventos = [
    'linea.actualizada',
    'aviso.activo',
    'aviso.retirado',
    'aviso.descartado',
    'pedido.nuevo',
    'pedido.modificado',
    'pedido-confirmado',
    'pedido-modificado',
    'pedido-anulado',
    'pedido.reabierto',
    'pedido.pendientes-cambiado',
    'mesa-cerrada',
  ];

  const oyentes = [];

  for (const nombre of eventos) {
    const handler = (evento) => {
      let datos = {};
      try {
        datos = JSON.parse(evento.data);
      } catch {
        // El evento puede venir sin datos JSON.
      }
      onEvento?.(nombre, datos);
    };
    conexion.addEventListener(nombre, handler);
    oyentes.push({ nombre, handler });
  }

  return () => {
    for (const { nombre, handler } of oyentes) {
      conexion.removeEventListener(nombre, handler);
    }
    conexion.close();
  };
}
