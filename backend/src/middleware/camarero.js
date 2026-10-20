import { ErrorHttp } from './error.js';

export const CAMARERO_POR_DEFECTO = 'camarero-1';

/**
 * Identifica al camarero de la petición a partir de la sesión existente.
 * En esta versión no hay inicio de sesión: el identificador llega en la
 * cabecera `X-Camarero-Id` y debe corresponder a un usuario con rol camarero.
 */
export function identificarCamarero(db) {
  return (req, res, next) => {
    const camareroId = req.get('X-Camarero-Id') ?? CAMARERO_POR_DEFECTO;
    const usuario = db.prepare('SELECT id, nombre, rol FROM usuarios WHERE id = ?').get(camareroId);

    if (!usuario || usuario.rol !== 'camarero') {
      next(new ErrorHttp(401, 'Camarero no identificado'));
      return;
    }

    req.camarero = usuario;
    next();
  };
}
