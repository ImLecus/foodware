import express from 'express';
import { cookieSesion, cookieSesionBorrada, leerCookie } from '../auth/cookies.js';
import { verifyPassword } from '../auth/password.js';
import { crearSesion, eliminarSesion, limpiarSesionesCaducadas } from '../auth/sesiones.js';
import { ErrorHttp } from '../middleware/error.js';
import { autenticar } from '../middleware/autenticar.js';

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    partida: usuario.partida_codigo ?? usuario.partida ?? null,
  };
}

export function authRouter(db) {
  const router = express.Router();

  router.post('/login', (req, res, next) => {
    try {
      const usuarioId = req.body?.usuario;
      const password = req.body?.password;

      if (
        typeof usuarioId !== 'string' ||
        typeof password !== 'string' ||
        !usuarioId ||
        !password
      ) {
        throw new ErrorHttp(400, 'Usuario y contraseña son obligatorios', 'datos_invalidos');
      }

      const usuario = db
        .prepare('SELECT id, nombre, rol, partida_codigo, password_hash FROM usuarios WHERE id = ?')
        .get(usuarioId);

      if (!usuario || !verifyPassword(password, usuario.password_hash)) {
        throw new ErrorHttp(401, 'Usuario o contraseña incorrectos', 'credenciales_incorrectas');
      }

      limpiarSesionesCaducadas(db);
      const { token } = crearSesion(db, usuario.id);
      res.setHeader('Set-Cookie', cookieSesion(token));
      res.json(usuarioPublico(usuario));
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', autenticar(db), (req, res) => {
    res.json(req.usuario);
  });

  router.post('/logout', (req, res) => {
    const token = leerCookie(req);
    if (token) {
      eliminarSesion(db, token);
    }
    res.setHeader('Set-Cookie', cookieSesionBorrada());
    res.status(204).end();
  });

  return router;
}
