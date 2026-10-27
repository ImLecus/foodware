import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function crearSesion(db, usuarioId, { ttlMinutes = config.sessionTtlMinutes } = {}) {
  const token = randomBytes(32).toString('base64url');
  const modificador = `+${ttlMinutes} minutes`;

  db.prepare(
    `INSERT INTO sesiones (token_hash, usuario_id, expira_en)
     VALUES (?, ?, datetime('now', ?))`,
  ).run(hashToken(token), usuarioId, modificador);

  const fila = db
    .prepare('SELECT expira_en FROM sesiones WHERE token_hash = ?')
    .get(hashToken(token));

  return { token, expiraEn: fila.expira_en };
}

/**
 * Devuelve el usuario de una sesión válida y renueva su ventana de inactividad.
 */
export function buscarSesion(db, token, { ttlMinutes = config.sessionTtlMinutes } = {}) {
  const tokenHash = hashToken(token);
  const sesion = db
    .prepare(
      `SELECT s.token_hash, s.usuario_id, u.id, u.nombre, u.rol, u.partida_codigo
         FROM sesiones s
         JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token_hash = ?
          AND s.expira_en > datetime('now')`,
    )
    .get(tokenHash);

  if (!sesion) return null;

  db.prepare(
    `UPDATE sesiones
        SET ultima_actividad = datetime('now'),
            expira_en = datetime('now', ?)
      WHERE token_hash = ?`,
  ).run(`+${ttlMinutes} minutes`, tokenHash);

  return {
    id: sesion.id,
    nombre: sesion.nombre,
    rol: sesion.rol,
    partida: sesion.partida_codigo ?? null,
  };
}

export function eliminarSesion(db, token) {
  db.prepare('DELETE FROM sesiones WHERE token_hash = ?').run(hashToken(token));
}

export function limpiarSesionesCaducadas(db) {
  db.prepare("DELETE FROM sesiones WHERE expira_en <= datetime('now')").run();
}
