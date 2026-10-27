import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb } from '../../src/db/index.js';
import { requireRole } from '../../src/middleware/authorize.js';

function crearApp(db) {
  const app = express();
  app.get('/protegido', requireRole(db, 'encargado'), (req, res) => {
    res.json({ usuario: req.usuario.id });
  });
  return app;
}

describe('requireRole', () => {
  let db;
  let app;

  beforeEach(() => {
    db = createDb(':memory:');
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'camarero-1',
      'Ana',
      'camarero',
    );
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'encargado-1',
      'Carmen',
      'encargado',
    );
    app = crearApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('responde 401 sin cabecera de identidad', async () => {
    const respuesta = await request(app).get('/protegido');

    expect(respuesta.status).toBe(401);
  });

  it('responde 401 si el usuario no existe', async () => {
    const respuesta = await request(app).get('/protegido').set('x-usuario-id', 'desconocido');

    expect(respuesta.status).toBe(401);
  });

  it('responde 403 si el rol no es el exigido', async () => {
    const respuesta = await request(app).get('/protegido').set('x-usuario-id', 'camarero-1');

    expect(respuesta.status).toBe(403);
  });

  it('permite el acceso y expone el usuario con el rol correcto', async () => {
    const respuesta = await request(app).get('/protegido').set('x-usuario-id', 'encargado-1');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ usuario: 'encargado-1' });
  });
});
