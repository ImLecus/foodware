/**
 * Autorización por rol. La identidad del usuario llega en cada petición en la
 * cabecera `x-usuario-id` (sesión existente, ver specs/001-comandas/research.md).
 * Responde 401 si no hay usuario identificado y 403 si no tiene el rol exigido.
 */
export function requireRole(db, rolRequerido) {
  const buscarUsuario = db.prepare('SELECT id, nombre, rol FROM usuarios WHERE id = ?');

  return function autorizar(req, res, next) {
    const usuarioId = req.get('x-usuario-id');
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const usuario = buscarUsuario.get(usuarioId);
    if (!usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (usuario.rol !== rolRequerido) {
      return res.status(403).json({ error: 'Acceso restringido' });
    }

    req.usuario = usuario;
    return next();
  };
}
