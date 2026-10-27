import { apiGet } from './api.js';
import { USUARIO_ID } from './sesion.js';

/**
 * Obtiene el informe diario del dashboard. Si se omite `fecha`, el backend usa el
 * último día natural completado (Europe/Madrid).
 * @param {string} [fecha] Fecha en formato `YYYY-MM-DD`.
 */
export function obtenerInformeDiario(fecha) {
  const ruta = fecha ? `/reports/daily?date=${encodeURIComponent(fecha)}` : '/reports/daily';
  return apiGet(ruta, { 'x-usuario-id': USUARIO_ID });
}
