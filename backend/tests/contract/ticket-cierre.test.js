import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  CABECERA_CAMARERO,
  crearBaseDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Ticket final de la cuenta (US3)', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function prepararConPedido() {
    db = crearBaseDePrueba();
    app = createApp(db);
    const pedidoId = await crearPedidoEnviado(app);
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

  it('no emite el ticket mientras quede alguna parte pendiente', async () => {
    await prepararConPedido();
    const [ana] = await dividirEnDos();

    const pago = await pagar(ana.id);
    expect(pago.status).toBe(200);
    expect(pago.body.ticket_estado).toBe('no_emitido');
    expect(pago.body.ticket).toBeNull();

    const ticket = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta/ticket')
      .set(CABECERA_CAMARERO);

    expect(ticket.status).toBe(409);
    expect(ticket.body.codigo).toBe('ticket_no_emitido');
    expect(ticket.body.ticket_estado).toBe('no_emitido');

    const cuenta = await request(app).get('/api/sala/mesas/mesa-1/cuenta').set(CABECERA_CAMARERO);
    expect(cuenta.status).toBe(200);
    expect(cuenta.body.ticket_estado).toBe('no_emitido');
    expect(cuenta.body.division.partes.map((parte) => parte.estado)).toEqual([
      'pagada',
      'pendiente',
    ]);
  });

  it('emite un único ticket con el desglose al pagar la última parte', async () => {
    await prepararConPedido();
    const [ana, luis] = await dividirEnDos();

    await pagar(ana.id);
    const ultimoPago = await pagar(luis.id);

    expect(ultimoPago.status).toBe(200);
    expect(ultimoPago.body.ticket_estado).toBe('emitido');
    expect(ultimoPago.body.mesa_abierta).toBe(false);
    expect(ultimoPago.body.ticket).toMatchObject({
      estado: 'emitido',
      mesa_id: 'mesa-1',
      identificador: 'Mesa 1',
      total_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });

    const ticket = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta/ticket')
      .set(CABECERA_CAMARERO);

    expect(ticket.status).toBe(200);
    expect(ticket.body).toEqual(ultimoPago.body.ticket);
  });

  it('bloquea la última parte si quedan platos pendientes y permite cerrar tras cocinarlos', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);
    const pedidoId = await crearPedidoEnviado(app);
    const [ana, luis] = await dividirEnDos();

    const primera = await pagar(ana.id);
    expect(primera.status).toBe(200);

    const ultimaBloqueada = await pagar(luis.id);
    expect(ultimaBloqueada.status).toBe(409);
    expect(ultimaBloqueada.body.codigo).toBe('platos_pendientes');
    expect(ultimaBloqueada.body.platos).toHaveLength(3);
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('ocupada');

    await marcarPedidoListo(app, pedidoId);

    const ultima = await pagar(luis.id);
    expect(ultima.status).toBe(200);
    expect(ultima.body.ticket_estado).toBe('emitido');
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('libre');
  });

  it('rechaza el cierre único de una cuenta dividida', async () => {
    await prepararConPedido();
    await dividirEnDos();

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('cuenta_dividida');
  });

  it('el cierre único emite un ticket sin partes', async () => {
    await prepararConPedido();

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.ticket).toMatchObject({
      estado: 'emitido',
      mesa_id: 'mesa-1',
      identificador: 'Mesa 1',
      total_centimos: 3250,
      partes: [],
    });
  });

  it('devuelve 404 al consultar el ticket de una mesa inexistente', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);

    const respuesta = await request(app)
      .get('/api/sala/mesas/mesa-inexistente/cuenta/ticket')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(404);
  });

  it('devuelve 409 al consultar el ticket de una cuenta abierta sin división', async () => {
    await prepararConPedido();

    const respuesta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta/ticket')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('ticket_no_emitido');
  });
});
