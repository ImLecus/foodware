export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    const usuarioId = req.headers['x-usuario-id'];
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const db = req.app?.locals?.db;
    if (!db) {
      return res.status(500).json({ error: 'Error interno' });
    }
    const usuario = db.prepare('SELECT id, rol FROM usuarios WHERE id = ?').get(usuarioId);
    if (!usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ error: 'Prohibido' });
    }
    req.usuario = usuario;
    next();
  };
}
