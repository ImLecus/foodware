export function requireRole(dbOrRole, ...rolesRest) {
  // Soporte para ambas firmas:
  // 1) requireRole(db, 'encargado') - estilo antiguo usado en tests
  // 2) requireRole('administrador') - estilo nuevo HU08 (lee db de req.app.locals)
  let db;
  let rolesPermitidos = [];

  if (dbOrRole && typeof dbOrRole.prepare === 'function') {
    db = dbOrRole;
    rolesPermitidos = rolesRest.filter(Boolean);
  } else {
    rolesPermitidos = [dbOrRole, ...rolesRest].filter(Boolean);
  }

  return (req, res, next) => {
    const usuarioId = req.headers['x-usuario-id'];
    if (!usuarioId) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const dbActual = db || req.app?.locals?.db;
    if (!dbActual) {
      return res.status(500).json({ error: 'Error interno' });
    }
    const usuario = dbActual.prepare('SELECT id, rol FROM usuarios WHERE id = ?').get(usuarioId);
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
