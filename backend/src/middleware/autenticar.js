import { cookieSesion, leerCookie } from '../auth/cookies.js';
import { buscarSesion } from '../auth/sesiones.js';
import { ErrorHttp } from './error.js';

/**
 * Convierte la cookie de sesión en `req.usuario`.
 * Mantiene compatibilidad con cabecera `x-usuario-id` para tests/compatibilidad.
 */
export function autenticar(db) {
  return (req, res, next) => {
    const token = leerCookie(req);
    if (token) {
      const usuario = buscarSesion(db, token);
      if (!usuario) {
        next(new ErrorHttp(401, 'Sesión no válida o caducada', 'sesion_invalida'));
        return;
      }

      // La cookie también se renueva para que su Max-Age siga a la sesión deslizante.
      res.setHeader('Set-Cookie', cookieSesion(token));
      req.usuario = usuario;
      if (usuario.rol === 'camarero') {
        req.camarero = usuario;
      }
      next();
      return;
    }

    // Fallback: cabecera x-usuario-id (compatibilidad HU08/tests)
    const usuarioId = req.headers['x-usuario-id'];
    if (!usuarioId) {
      next(new ErrorHttp(401, 'No autenticado', 'no_autenticado'));
      return;
    }

    const usuario = db.prepare('SELECT id, nombre, rol FROM usuarios WHERE id = ?').get(usuarioId);
    if (!usuario) {
      next(new ErrorHttp(401, 'No autenticado', 'no_autenticado'));
      return;
    }

    req.usuario = usuario;
    if (usuario.rol === 'camarero') {
      req.camarero = usuario;
    }
    next();
  };
}
