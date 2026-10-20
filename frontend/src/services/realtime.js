import { API_BASE } from './api.js';

/**
 * Abre el canal SSE compartido. EventSource reconecta solo; la vista
 * debe reaccionar a los eventos 'open' y 'error'.
 */
export function crearConexionEventos() {
  return new EventSource(`${API_BASE}/eventos`);
}
