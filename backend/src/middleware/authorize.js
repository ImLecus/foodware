import { ErrorHttp } from './error.js';

/**
 * Autoriza una petición ya autenticada según su rol de sesión.
 * Sin usuario -> 401; rol no incluido -> 403.
 */
export function requireRole(...roles) {
  return function autorizar(req, res, next) {
    if (!req.usuario) {
      next(new ErrorHttp(401, 'No autenticado', 'no_autenticado'));
      return;
    }

    if (!roles.includes(req.usuario.rol)) {
      next(new ErrorHttp(403, 'No tienes permisos para acceder a esta sección', 'sin_permiso'));
      return;
    }

    next();
  };
}
