import { createHash } from 'node:crypto';
import { config } from '../../src/config.js';
import { hashPassword } from '../../src/auth/password.js';

export const TOKENS = {
  'camarero-1': 'test-camarero-1',
  'camarero-2': 'test-camarero-2',
  'cocinero-entrantes': 'test-cocinero-entrantes',
  'cocinero-principales': 'test-cocinero-principales',
  'cocinero-postres': 'test-cocinero-postres',
  'cocinero-sin-partida': 'test-cocinero-sin-partida',
  'encargado-1': 'test-encargado-1',
  'admin-1': 'test-admin-1',
};

export function cookiePara(usuarioId) {
  const token = TOKENS[usuarioId];
  return {
    Cookie: `${config.sessionCookieName}=${token}`,
  };
}

export const CABECERA_CAMARERO = cookiePara('camarero-1');
export const CABECERA_CAMARERO_2 = cookiePara('camarero-2');
export const CABECERA_COCINERO = cookiePara('cocinero-entrantes');
export const CABECERA_COCINERO_SIN_PARTIDA = cookiePara('cocinero-sin-partida');
export const CABECERA_COCINERO_PRINCIPALES = cookiePara('cocinero-principales');
export const CABECERA_COCINERO_POSTRES = cookiePara('cocinero-postres');
export const CABECERA_ENCARGADO = cookiePara('encargado-1');
export const CABECERA_ADMIN = cookiePara('admin-1');

export function cookieCocinero(partida) {
  return cookiePara(`cocinero-${partida}`);
}

export const DEMO_PASSWORD = 'demo1234';

export function insertarCredencialesDemo(db) {
  const hash = hashPassword(DEMO_PASSWORD);
  db.prepare('UPDATE usuarios SET password_hash = ?').run(hash);
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** Inserta sesiones válidas para todos los usuarios demo de la base de pruebas. */
export function insertarSesionesPrueba(db) {
  const insertar = db.prepare(
    `INSERT OR IGNORE INTO sesiones (token_hash, usuario_id, expira_en)
     VALUES (?, ?, datetime('now', '+1 day'))`,
  );

  for (const [usuarioId, token] of Object.entries(TOKENS)) {
    const usuario = db.prepare('SELECT id FROM usuarios WHERE id = ?').get(usuarioId);
    if (usuario) insertar.run(hashToken(token), usuarioId);
  }
}
