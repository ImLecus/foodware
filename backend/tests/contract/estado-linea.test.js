import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { CABECERA_CAMARERO } from '../ayuda.js';

/**
 * El marcado de líneas es el mecanismo que la historia 004 ya expone; la 005
 * lo reutiliza y comprueba que el estado enviado se refleja en la vista de sala.
 */
describe('PUT /api/pedidos/:pedidoId/lineas/:lineaId/estado (vista de sala)', () => {
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
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', platoId: 'plato-principal' });
  }

  async function leerSala() {
    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);
    return respuesta.body.mesas;
  }

  it('marca una línea como lista y la instantánea de sala lo refleja', async () => {
    preparar();

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('listo');

    const [mesa] = await leerSala();
    const platoListo = mesa.platos.find((plato) => plato.id === 'linea-1');
    const platoPendiente = mesa.platos.find((plato) => plato.id === 'linea-2');

    expect(platoListo.estado).toBe('listo');
    expect(platoPendiente.estado).toBe('pendiente');
    expect(mesa.completa).toBe(false);
  });

  it('deshace la marca y la instantánea de sala vuelve a pendiente', async () => {
    preparar();

    await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    const respuesta = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'pendiente' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('pendiente');
    expect(respuesta.body.listoEn).toBeNull();

    const [mesa] = await leerSala();
    expect(mesa.platos.find((plato) => plato.id === 'linea-1').estado).toBe('pendiente');
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
    expect(segundo.body.listoEn).toBe(primero.body.listoEn);
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
