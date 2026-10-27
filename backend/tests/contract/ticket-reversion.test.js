import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  CABECERA_CAMARERO,
  crearBaseDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Pago y reversión de partes (US3)', () => {
  let db;
  let app;
  let pedidoId;

  afterEach(() => {
    db?.close();
  });

  async function prepararConPedido() {
    db = crearBaseDePrueba();
    app = createApp(db);
    pedidoId = await crearPedidoEnviado(app);
    await marcarPedidoListo(app, pedidoId);
  }

  async function dividirEnDos() {
    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/division')
      .set(CABECERA_CAMARERO)
      .send({
        modo: 'iguales',
        total_base_centimos: 3250,
        partes: [
          { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
          { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
        ],
      });

    expect(respuesta.status).toBe(201);
    return respuesta.body.division.partes;
  }

  function pagar(parteId) {
    return request(app)
      .post(`/api/sala/mesas/mesa-1/cuenta/partes/${parteId}/pago`)
      .set(CABECERA_CAMARERO);
  }

  function deshacer(parteId) {
    return request(app)
      .delete(`/api/sala/mesas/mesa-1/cuenta/partes/${parteId}/pago`)
      .set(CABECERA_CAMARERO);
  }

  it('marca una parte intermedia como pagada sin cerrar la mesa', async () => {
    await prepararConPedido();
    const [ana] = await dividirEnDos();

    const respuesta = await pagar(ana.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.parte).toMatchObject({
      id: ana.id,
      orden: 1,
      comensal: 'Ana',
      importe_centimos: 1625,
      estado: 'pagada',
    });
    expect(respuesta.body.parte.pagada_en).toEqual(expect.any(String));
    expect(respuesta.body.mesa_abierta).toBe(true);
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).not.toBe(
      'cerrada',
    );
  });

  it('devuelve 404 si la parte o la división no existen', async () => {
    await prepararConPedido();

    const sinDivision = await pagar('parte-inexistente');
    expect(sinDivision.status).toBe(404);

    const [ana] = await dividirEnDos();
    const otra = await pagar(randomUUID());
    expect(otra.status).toBe(404);
    expect(ana.id).toBeTruthy();
  });

  it('devuelve 409 si la parte ya estaba pagada', async () => {
    await prepararConPedido();
    const [ana] = await dividirEnDos();
    await pagar(ana.id);

    const respuesta = await pagar(ana.id);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/pagada/i);
  });

  it('deshace el pago de una parte y la devuelve a pendiente con la mesa abierta', async () => {
    await prepararConPedido();
    const [ana, luis] = await dividirEnDos();
    await pagar(ana.id);

    const respuesta = await deshacer(ana.id);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.parte).toMatchObject({
      id: ana.id,
      estado: 'pendiente',
      pagada_en: null,
    });
    expect(respuesta.body.ticket_estado).toBe('no_emitido');
    expect(respuesta.body.ticket).toBeNull();
    expect(respuesta.body.mesa_abierta).toBe(true);

    const deNuevo = await pagar(ana.id);
    expect(deNuevo.status).toBe(200);
    expect(luis.estado).toBe('pendiente');
  });

  it('devuelve 409 al deshacer una parte que ya estaba pendiente', async () => {
    await prepararConPedido();
    const [ana] = await dividirEnDos();

    const respuesta = await deshacer(ana.id);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/pendiente/i);
  });

  it('devuelve 409 al pagar o deshacer con la mesa ya cerrada', async () => {
    await prepararConPedido();
    const [ana, luis] = await dividirEnDos();
    await pagar(ana.id);
    await pagar(luis.id);

    expect((await pagar(luis.id)).status).toBe(409);
    expect((await deshacer(luis.id)).status).toBe(409);
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('libre');
    expect(
      db
        .prepare("SELECT estado FROM cuentas WHERE mesa_id = 'mesa-1' ORDER BY abierta_en DESC")
        .get().estado,
    ).toBe('cerrada');
  });

  it('descarta la división si el total de consumos ha cambiado', async () => {
    await prepararConPedido();
    const [ana] = await dividirEnDos();

    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES (?, ?, 'plato-postre', 1, 600)`,
    ).run(randomUUID(), pedidoId);

    const respuesta = await pagar(ana.id);

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.codigo).toBe('total_desactualizado');

    const cuenta = await request(app).get('/api/sala/mesas/mesa-1/cuenta').set(CABECERA_CAMARERO);
    expect(cuenta.status).toBe(200);
    expect(cuenta.body.total_centimos).toBe(3850);
    expect(cuenta.body.division).toBeNull();
  });
});
