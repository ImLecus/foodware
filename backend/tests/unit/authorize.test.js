import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createDb } from '../../src/db/index.js';
import { autenticar } from '../../src/middleware/autenticar.js';
import { requireRole } from '../../src/middleware/authorize.js';
import { manejadorErrores } from '../../src/middleware/error.js';
import { CABECERA_CAMARERO, CABECERA_ENCARGADO, insertarSesionesPrueba } from '../helpers/auth.js';

function crearApp(db) {
  const app = express();
  app.get('/protegido', autenticar(db), requireRole('encargado'), (req, res) => {
    res.json({ usuario: req.usuario.id });
  });
  app.use(manejadorErrores);
  return app;
}

describe('autenticación y autorización por rol', () => {
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
    insertarSesionesPrueba(db);
    app = crearApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('responde 401 sin cookie de sesión', async () => {
    const respuesta = await request(app).get('/protegido');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('no_autenticado');
  });

  it('responde 401 si la sesión no existe', async () => {
    const respuesta = await request(app)
      .get('/protegido')
      .set('Cookie', 'foodware_session=token-invalido');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('sesion_invalida');
  });

  it('responde 403 si el rol no es el exigido', async () => {
    const respuesta = await request(app).get('/protegido').set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('sin_permiso');
  });

  it('permite el acceso y expone el usuario de la sesión', async () => {
    const respuesta = await request(app).get('/protegido').set(CABECERA_ENCARGADO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ usuario: 'encargado-1' });
  });
});
