import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBase } from '../helpers/fixtures.js';

describe('contrato de errores de la API', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBase();
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('devuelve codigo y mensaje al no encontrar una partida', async () => {
    const respuesta = await request(app).get('/api/partidas/inexistente/pedidos-pendientes');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toMatchObject({
      codigo: 'partida_no_encontrada',
      mensaje: 'La partida indicada no existe',
    });
  });

  it('devuelve codigo y mensaje al no encontrar un cocinero', async () => {
    const respuesta = await request(app).get('/api/cocineros/desconocido');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toMatchObject({
      codigo: 'cocinero_no_encontrado',
      mensaje: 'El cocinero indicado no existe',
    });
  });

  it('el middleware genérico devuelve codigo y mensaje en español', async () => {
    const respuesta = await request(app).get('/api/mesas/inexistente/estado-platos');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toMatchObject({
      codigo: 'no_encontrado',
      mensaje: 'Mesa no encontrada',
    });
  });
});
