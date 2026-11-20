import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { CABECERA_COCINERO, CABECERA_COCINERO_PRINCIPALES } from '../ayuda.js';

describe('PUT /api/pedidos/:pedidoId/lineas/:lineaId/estado', () => {
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
      cantidad: 2,
    });
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('marca una línea como lista y devuelve su detalle', async () => {
    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .set(CABECERA_COCINERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      id: 'linea-1',
      pedidoId: 'pedido-1',
      nombrePlato: 'Croquetas',
      cantidad: 1,
      estado: 'listo',
      pedidoCompletado: false,
    });
    expect(respuesta.body.listoEn).not.toBeNull();

    const linea = db
      .prepare('SELECT estado, listo_en FROM lineas_pedido WHERE id = ?')
      .get('linea-1');
    expect(linea.estado).toBe('listo');
    expect(linea.listo_en).not.toBeNull();
  });

  it('es idempotente: volver a marcar no cambia el momento', async () => {
    const primera = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .set(CABECERA_COCINERO)
      .send({ estado: 'listo' });
    const segunda = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .set(CABECERA_COCINERO)
      .send({ estado: 'listo' });

    expect(segunda.status).toBe(200);
    expect(segunda.body.listoEn).toBe(primera.body.listoEn);
  });

  it('usa la partida asignada en la sesión', async () => {
    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_COCINERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('listo');
  });

  it('rechaza un estado no válido', async () => {
    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .set(CABECERA_COCINERO)
      .send({ estado: 'en_preparacion' });

    expect(respuesta.status).toBe(400);
  });

  it('devuelve 404 si la línea no pertenece al pedido', async () => {
    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/inexistente/estado?partida=entrantes')
      .set(CABECERA_COCINERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(404);
  });

  it('devuelve 403 si la línea no es de la partida indicada', async () => {
    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=principales')
      .set(CABECERA_COCINERO_PRINCIPALES)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toMatchObject({
      codigo: 'partida_ajena',
      mensaje: 'La línea no pertenece a tu partida',
    });
  });

  it('devuelve 409 al marcar listo un pedido ya completado', async () => {
    db.prepare("UPDATE lineas_pedido SET estado = 'listo', listo_en = datetime('now')").run();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado?partida=entrantes')
      .set(CABECERA_COCINERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toMatchObject({
      codigo: 'pedido_completado',
      mensaje: 'El pedido ya está completado',
    });
  });
});
