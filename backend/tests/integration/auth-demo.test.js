import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBaseDePrueba } from '../ayuda.js';
import { DEMO_PASSWORD, insertarCredencialesDemo } from '../helpers/auth.js';

const USUARIOS_DEMO = [
  ['camarero-1', 'camarero', null],
  ['camarero-2', 'camarero', null],
  ['cocinero-entrantes', 'cocinero', 'entrantes'],
  ['cocinero-principales', 'cocinero', 'principales'],
  ['cocinero-postres', 'cocinero', 'postres'],
  ['cocinero-sin-partida', 'cocinero', null],
  ['encargado-1', 'encargado', null],
  ['admin-1', 'administrador', null],
];

describe('Credenciales demo', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBaseDePrueba();
    insertarCredencialesDemo(db);
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it.each(USUARIOS_DEMO)('permite entrar a %s con la contraseña demo', async (id, rol, partida) => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ usuario: id, password: DEMO_PASSWORD });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ id, rol, partida });
  });
});
