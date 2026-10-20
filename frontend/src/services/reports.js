import { apiGet } from './api.js';

// Sin login implementado, la identidad del usuario viaja en la cabecera
// `x-usuario-id` (ver specs/001-comandas/research.md). Configurable por entorno.
export const USUARIO_ID = import.meta.env.VITE_USUARIO_ID ?? 'encargado-1';

/**
 * Obtiene el informe diario del dashboard. Si se omite `fecha`, el backend usa el
 * último día natural completado (Europe/Madrid).
 * @param {string} [fecha] Fecha en formato `YYYY-MM-DD`.
 */
export function obtenerInformeDiario(fecha) {
  const ruta = fecha ? `/reports/daily?date=${encodeURIComponent(fecha)}` : '/reports/daily';
  return apiGet(ruta, { 'x-usuario-id': USUARIO_ID });
}
