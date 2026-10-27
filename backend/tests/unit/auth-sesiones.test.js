import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb } from '../../src/db/index.js';
import {
  buscarSesion,
  crearSesion,
  eliminarSesion,
  hashToken,
  limpiarSesionesCaducadas,
} from '../../src/auth/sesiones.js';

describe('almacén de sesiones', () => {
  let db;

  beforeEach(() => {
    db = createDb(':memory:');
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'camarero-1',
      'Ana',
      'camarero',
    );
  });

  afterEach(() => {
    db?.close();
  });

  it('crea una sesión con token opaco y guarda solo su hash', () => {
    const { token } = crearSesion(db, 'camarero-1');

    expect(token).toHaveLength(43);
    const fila = db.prepare('SELECT * FROM sesiones').get();
    expect(fila.token_hash).toBe(hashToken(token));
    expect(fila.token_hash).not.toBe(token);
  });

  it('recupera al usuario y renueva la caducidad por inactividad', () => {
    const { token } = crearSesion(db, 'camarero-1', { ttlMinutes: 1 });
    const antes = db.prepare('SELECT expira_en FROM sesiones').get().expira_en;

    const usuario = buscarSesion(db, token, { ttlMinutes: 60 });

    expect(usuario).toMatchObject({ id: 'camarero-1', rol: 'camarero' });
    const despues = db.prepare('SELECT expira_en FROM sesiones').get().expira_en;
    expect(despues > antes).toBe(true);
  });

  it('rechaza sesiones caducadas', () => {
    db.prepare(
      `INSERT INTO sesiones (token_hash, usuario_id, expira_en)
       VALUES (?, ?, datetime('now', '-1 minute'))`,
    ).run(hashToken('caducada'), 'camarero-1');

    expect(buscarSesion(db, 'caducada')).toBeNull();
  });

  it('revoca una sesión y limpia las caducadas', () => {
    const { token } = crearSesion(db, 'camarero-1');
    eliminarSesion(db, token);
    expect(buscarSesion(db, token)).toBeNull();

    db.prepare(
      `INSERT INTO sesiones (token_hash, usuario_id, expira_en)
       VALUES (?, ?, datetime('now', '-1 minute'))`,
    ).run(hashToken('vieja'), 'camarero-1');
    limpiarSesionesCaducadas(db);
    expect(db.prepare('SELECT COUNT(*) AS total FROM sesiones').get().total).toBe(0);
  });
});
