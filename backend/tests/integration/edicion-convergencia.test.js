import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CABECERA_CAMARERO,
  cookieCocinero,
  crearAppDePrueba,
  crearPedidoEnviado,
} from '../ayuda.js';

describe('Edición · convergencia 2026-11-03', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    ({ db, app } = crearAppDePrueba());
  }

  async function abrirEdicion(pedidoId) {
    return request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
  }

  async function detalle(pedidoId) {
    return request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
  }

  it('cancela el pedido completo, libera la mesa y deja traza', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    expect((await abrirEdicion(pedidoId)).status).toBe(200);

    const cancelado = await request(app)
      .post(`/api/pedidos/${pedidoId}/cancelar`)
      .set(CABECERA_CAMARERO);

    expect(cancelado.status).toBe(200);
    expect(cancelado.body).toMatchObject({ estado: 'cancelada', mesa_estado: 'libre' });

    const pedido = db.prepare('SELECT estado, cancelada FROM pedidos WHERE id = ?').get(pedidoId);
    expect(pedido).toEqual({ estado: 'cerrada', cancelada: 1 });
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('libre');
    expect(
      db.prepare("SELECT tipo FROM modificaciones WHERE pedido_id = ? AND tipo = 'cancelar'").get(pedidoId),
    ).toBeTruthy();

    const pendientes = await request(app)
      .get('/api/partidas/entrantes/pedidos-pendientes')
      .set(cookieCocinero('entrantes'));
    expect(pendientes.body).toHaveLength(0);
  });

  it('rechaza el marcado de cocina de un pedido cancelado', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    const linea = (await detalle(pedidoId)).body.lineas[0];
    await abrirEdicion(pedidoId);
    await request(app).post(`/api/pedidos/${pedidoId}/cancelar`).set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${linea.id}/estado`)
      .set(cookieCocinero('entrantes'))
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('pedido_cancelado');
  });

  it('rechaza el marcado de cocina mientras el pedido está bloqueado', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    await abrirEdicion(pedidoId);
    const linea = (await detalle(pedidoId)).body.lineas[0];

    const respuesta = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${linea.id}/estado`)
      .set(cookieCocinero('entrantes'))
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(423);
    expect(respuesta.body.codigo).toBe('pedido_bloqueado');
  });

  it('subir la cantidad de una línea lista la devuelve a pendiente', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    const detalleInicial = await detalle(pedidoId);
    const linea = detalleInicial.body.lineas.find((fila) => fila.partida === 'entrantes');

    const listo = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${linea.id}/estado`)
      .set(cookieCocinero('entrantes'))
      .send({ estado: 'listo' });
    expect(listo.status).toBe(200);

    await abrirEdicion(pedidoId);
    const cambiada = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${linea.id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: linea.cantidad + 1 });

    expect(cambiada.status).toBe(200);
    expect(cambiada.body).toMatchObject({ estado: 'pendiente', listo_en: null });
  });

  it('corrige las indicaciones de una línea enviada', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    const linea = (await detalle(pedidoId)).body.lineas[0];
    await abrirEdicion(pedidoId);

    const respuesta = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${linea.id}`)
      .set(CABECERA_CAMARERO)
      .send({ indicaciones: 'sin sal' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.indicaciones).toBe('sin sal');
  });

  it('bloquea la edición si la cuenta tiene una parte pagada', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, pedido_id, estado, total_centimos, modo_division)
       VALUES ('cuenta-test', 'mesa-1', ?, 'abierta', 100, 'iguales')`,
    ).run(pedidoId);
    db.prepare(
      `INSERT INTO cuentas_partes
         (id, cuenta_id, orden, comensal, importe_centimos, estado, pagada_en)
       VALUES ('parte-test', 'cuenta-test', 1, 'Parte 1', 100, 'pagada', datetime('now'))`,
    ).run();

    const respuesta = await abrirEdicion(pedidoId);
    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('partes_pagadas');
  });

  it('mantiene la línea enviada aunque el plato deje de estar disponible', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    db.prepare("UPDATE platos SET activo = 0 WHERE id = 'plato-entrante'").run();

    const respuesta = await detalle(pedidoId);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.lineas.some((linea) => linea.plato_id === 'plato-entrante')).toBe(true);
  });
});
