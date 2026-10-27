import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('deshacer la última marca de un pedido completado', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, {
      id: 'linea-2',
      pedidoId: 'pedido-1',
      platoId: 'plato-entrante-2',
    });
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  async function completarPedido() {
    await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .send({ estado: 'listo' });
    await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-2/estado?partida=entrantes')
      .send({ estado: 'listo' });
  }

  it('mantiene el 409 al intentar marcar listo un pedido completado', async () => {
    await completarPedido();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(409);
  });

  it('deshace la última línea completada y limpia listoEn', async () => {
    await completarPedido();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-2/estado?partida=entrantes')
      .send({ estado: 'pendiente' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      id: 'linea-2',
      estado: 'pendiente',
      listoEn: null,
      pedidoReabierto: true,
    });
  });

  it('hace reaparecer el pedido en la lista de pendientes tras deshacer', async () => {
    await completarPedido();

    const antes = await request(app).get('/api/partidas/entrantes/pedidos-pendientes');
    expect(antes.body).toEqual([]);

    await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-2/estado?partida=entrantes')
      .send({ estado: 'pendiente' });

    const despues = await request(app).get('/api/partidas/entrantes/pedidos-pendientes');
    expect(despues.body.map((pedido) => pedido.id)).toEqual(['pedido-1']);
    expect(despues.body[0].lineas.find((linea) => linea.id === 'linea-2').estado).toBe('pendiente');
  });
});
