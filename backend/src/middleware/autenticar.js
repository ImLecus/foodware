import { cookieSesion, leerCookie } from '../auth/cookies.js';
import { buscarSesion } from '../auth/sesiones.js';
import { ErrorHttp } from './error.js';

/**
 * Convierte la cookie de sesión en `req.usuario`.
 * No acepta cabeceras, variables de entorno ni parámetros de URL como identidad.
 */
export function autenticar(db) {
  return (req, res, next) => {
    const token = leerCookie(req);
    if (!token) {
      next(new ErrorHttp(401, 'No autenticado', 'no_autenticado'));
      return;
    }

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
  };
}
