import { config } from '../config.js';
import { ErrorHttp } from './error.js';

const METODOS_CON_ORIGEN = new Set(['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);

/**
 * Rechaza las escrituras y preflights de orígenes no configurados.
 *
 * `cors` solo decide qué cabeceras se devuelven; por sí solo no impide que una
 * petición no-browser (o un intento CSRF) ejecute la operación. Este guard se
 * coloca antes de `cors` para cortar la petición antes de tocar datos o sesión.
 */
export function comprobarOrigen(req, res, next) {
  const origen = req.get('origin');
  if (!origen || !METODOS_CON_ORIGEN.has(req.method)) {
    next();
    return;
  }

  if (origen === config.corsOrigin) {
    next();
    return;
  }

  next(new ErrorHttp(403, 'Origen no permitido', 'origen_no_permitido'));
}
