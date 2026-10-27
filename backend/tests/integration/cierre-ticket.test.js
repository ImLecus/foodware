import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  CABECERA_CAMARERO,
  crearBaseDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Cierre de la cuenta con pago por partes (US3)', () => {
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

    return respuesta.body.division.partes;
  }

  function pagar(parteId) {
    return request(app)
      .post(`/api/sala/mesas/mesa-1/cuenta/partes/${parteId}/pago`)
      .set(CABECERA_CAMARERO);
  }

  it('mantiene la mesa abierta hasta pagar todas las partes y entonces la cierra con ticket', async () => {
    await prepararConPedido();
    const [ana, luis] = await dividirEnDos();

    const primero = await pagar(ana.id);
    expect(primero.status).toBe(200);
    expect(primero.body.mesa_abierta).toBe(true);

    const cuentaAbierta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuentaAbierta.status).toBe(200);
    expect(cuentaAbierta.body.division.partes.map((parte) => parte.estado)).toEqual([
      'pagada',
      'pendiente',
    ]);
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).not.toBe(
      'cerrada',
    );

    const segundo = await pagar(luis.id);
    expect(segundo.status).toBe(200);
    expect(segundo.body.mesa_abierta).toBe(false);
    expect(segundo.body.ticket.partes).toHaveLength(2);
    expect(segundo.body.ticket.total_centimos).toBe(3250);

    const mesa = db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get();
    expect(mesa.estado).toBe('libre');

    const cuentaCerrada = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuentaCerrada.status).toBe(409);

    const ticket = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta/ticket')
      .set(CABECERA_CAMARERO);
    expect(ticket.status).toBe(200);
    expect(ticket.body.total_centimos).toBe(3250);
    expect(ticket.body.partes).toHaveLength(2);
  });

  it('permite abrir un pedido nuevo en la mesa liberada', async () => {
    await prepararConPedido();
    const [ana, luis] = await dividirEnDos();
    await pagar(ana.id);
    await pagar(luis.id);

    const respuesta = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.estado).toBe('en_curso');
  });
});
