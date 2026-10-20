import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('GET /api/partidas/:partidaId/pedidos-pendientes', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  function montarEscenario() {
    db = crearBase();

    insertarPedido(db, { id: 'pedido-antiguo', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'l-1', pedidoId: 'pedido-antiguo', estado: 'listo' });
    insertarLinea(db, {
      id: 'l-2',
      pedidoId: 'pedido-antiguo',
      platoId: 'plato-entrante-2',
    });

    insertarPedido(db, { id: 'pedido-b', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'l-3', pedidoId: 'pedido-b' });

    insertarPedido(db, { id: 'pedido-a', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'l-4', pedidoId: 'pedido-a', platoId: 'plato-entrante-2' });

    insertarPedido(db, {
      id: 'pedido-sin-entrantes-pendientes',
      enviadoEn: '2026-10-20 08:00:00',
    });
    insertarLinea(db, {
      id: 'l-5',
      pedidoId: 'pedido-sin-entrantes-pendientes',
      estado: 'listo',
    });
    insertarLinea(db, {
      id: 'l-6',
      pedidoId: 'pedido-sin-entrantes-pendientes',
      platoId: 'plato-principal',
    });

    return createApp(db);
  }

  it('filtra por partida, ordena por envío y desempata por id', async () => {
    const app = montarEscenario();

    const respuesta = await request(app).get('/api/partidas/entrantes/pedidos-pendientes');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((pedido) => pedido.id)).toEqual([
      'pedido-antiguo',
      'pedido-a',
      'pedido-b',
    ]);
  });

  it('devuelve la forma del contrato: mesa, envío, modificado y todas las líneas', async () => {
    const app = montarEscenario();

    const respuesta = await request(app).get('/api/partidas/entrantes/pedidos-pendientes');
    const primero = respuesta.body[0];

    expect(primero).toMatchObject({
      id: 'pedido-antiguo',
      mesa: 1,
      partida: 'entrantes',
      enviadoEn: '2026-10-20T09:00:00.000Z',
      modificado: false,
      estado: 'pendiente',
    });
    expect(primero.lineas).toHaveLength(2);
    expect(primero.lineas[0]).toMatchObject({
      id: 'l-1',
      nombrePlato: 'Croquetas',
      cantidad: 1,
      estado: 'listo',
    });
  });

  it('devuelve 404 si la partida no existe', async () => {
    db = crearBase();
    const app = createApp(db);

    const respuesta = await request(app).get('/api/partidas/bar/pedidos-pendientes');

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('partida_no_encontrada');
  });

  it('devuelve una lista vacía si no hay pedidos pendientes', async () => {
    db = crearBase();
    const app = createApp(db);

    const respuesta = await request(app).get('/api/partidas/postres/pedidos-pendientes');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([]);
  });
});

describe('GET /api/cocineros/:cocineroId', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('devuelve la partida asignada', async () => {
    db = crearBase();

    const respuesta = await request(createApp(db)).get('/api/cocineros/cocinero-entrantes');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
  });

  it('devuelve partida null si el cocinero no tiene asignación', async () => {
    db = crearBase();

    const respuesta = await request(createApp(db)).get('/api/cocineros/cocinero-sin-partida');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.partida).toBeNull();
  });

  it('devuelve 404 si el cocinero no existe', async () => {
    db = crearBase();

    const respuesta = await request(createApp(db)).get('/api/cocineros/desconocido');

    expect(respuesta.status).toBe(404);
  });
});
