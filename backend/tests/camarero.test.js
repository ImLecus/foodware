import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createDb } from '../src/db/index.js';
import { identificarCamarero } from '../src/middleware/camarero.js';
import { manejadorErrores } from '../src/middleware/error.js';

function crearAppDePrueba(db) {
  const app = express();
  app.use(identificarCamarero(db));
  app.get('/protegido', (req, res) => res.json({ camarero: req.camarero.id }));
  app.use(manejadorErrores);
  return app;
}

describe('middleware de identidad del camarero', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    db = createDb(':memory:');
    db.prepare(
      "INSERT INTO usuarios (id, nombre, rol) VALUES ('camarero-1', 'Ana', 'camarero')",
    ).run();
    db.prepare(
      "INSERT INTO usuarios (id, nombre, rol) VALUES ('camarero-2', 'Luis', 'camarero')",
    ).run();
    db.prepare(
      "INSERT INTO usuarios (id, nombre, rol) VALUES ('cocinero-1', 'Marta', 'cocinero')",
    ).run();
  }

  it('usa el camarero por defecto si no llega la cabecera', async () => {
    preparar();

    const respuesta = await request(crearAppDePrueba(db)).get('/protegido');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ camarero: 'camarero-1' });
  });

  it('identifica al camarero indicado en la cabecera', async () => {
    preparar();

    const respuesta = await request(crearAppDePrueba(db))
      .get('/protegido')
      .set('X-Camarero-Id', 'camarero-2');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ camarero: 'camarero-2' });
  });

  it('devuelve 401 si el usuario no existe o no es camarero', async () => {
    preparar();
    const app = crearAppDePrueba(db);

    const desconocido = await request(app).get('/protegido').set('X-Camarero-Id', 'desconocido');
    const cocinero = await request(app).get('/protegido').set('X-Camarero-Id', 'cocinero-1');

    expect(desconocido.status).toBe(401);
    expect(cocinero.status).toBe(401);
  });
});
