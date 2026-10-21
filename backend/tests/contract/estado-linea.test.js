import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { CABECERA_CAMARERO } from '../ayuda.js';

describe('PUT /api/pedidos/:pedidoId/lineas/:lineaId/estado', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    db = crearBase();
    app = createApp(db);
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
  }

  it('marca una línea como lista y devuelve el estado de la mesa', async () => {
    preparar();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      linea_id: 'linea-1',
      pedido_id: 'pedido-1',
      mesa_id: 'mesa-1',
      estado: 'listo',
    });
    expect(respuesta.body.marcado_en).toEqual(expect.any(String));
    expect(respuesta.body.mesa).toEqual({ completa: true, aviso: null });
  });

  it('deshace la marca y deja la línea pendiente', async () => {
    preparar();
    db.prepare(
      "UPDATE lineas_pedido SET estado = 'listo', listo_en = datetime('now') WHERE id = 'linea-1'",
    ).run();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'pendiente' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('pendiente');
    expect(respuesta.body.marcado_en).toBeNull();
  });

  it('es idempotente al marcar dos veces como listo', async () => {
    preparar();

    const primero = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });
    const segundo = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(primero.status).toBe(200);
    expect(segundo.status).toBe(200);
    expect(segundo.body.estado).toBe('listo');
  });

  it('rechaza un estado no válido con 400', async () => {
    preparar();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'servido' });

    expect(respuesta.status).toBe(400);
  });

  it('rechaza marcar una línea de un pedido no enviado con 409', async () => {
    db = crearBase();
    app = createApp(db);
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES ('pedido-curso', 'mesa-1', 'camarero-1', 'en_curso')",
    ).run();
    insertarLinea(db, { id: 'linea-curso', pedidoId: 'pedido-curso' });

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-curso/lineas/linea-curso/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(409);
  });

  it('devuelve 404 si la línea no existe', async () => {
    preparar();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/inexistente/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(404);
  });
});
