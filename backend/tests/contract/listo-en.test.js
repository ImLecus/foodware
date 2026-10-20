import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { marcarLinea } from '../../src/services/marcarListo.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('listoEn en las respuestas de la API', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', platoId: 'plato-entrante-2' });
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('incluye listoEn en la lista de pendientes y en el estado de sala', async () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });

    const pendientes = await request(app).get('/api/partidas/entrantes/pedidos-pendientes');
    const lineaPendientes = pendientes.body[0].lineas.find((linea) => linea.id === 'linea-1');
    expect(lineaPendientes.listoEn).not.toBeNull();

    const sala = await request(app).get('/api/mesas/mesa-1/estado-platos');
    const lineaSala = sala.body.find((linea) => linea.id === 'linea-1');
    expect(lineaSala.listoEn).toBe(lineaPendientes.listoEn);
  });

  it('devuelve listoEn en la respuesta del PUT', async () => {
    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.listoEn).not.toBeNull();
  });

  it('devuelve listoEn null tras deshacer', async () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .send({ estado: 'pendiente' });

    expect(respuesta.body.listoEn).toBeNull();
  });
});
