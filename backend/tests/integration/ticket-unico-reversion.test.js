import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import {
  CABECERA_CAMARERO,
  clienteSseFalso,
  crearBaseDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Ticket único y reversión de partes (US3)', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  async function prepararConPedido() {
    db = crearBaseDePrueba();
    app = createApp(db);
    const pedidoId = await crearPedidoEnviado(app);
    await marcarPedidoListo(app, pedidoId);
  }

  async function dividirEnTres() {
    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/division')
      .set(CABECERA_CAMARERO)
      .send({
        modo: 'iguales',
        total_base_centimos: 3250,
        partes: [
          { orden: 1, comensal: 'Ana', importe_centimos: 1084 },
          { orden: 2, comensal: 'Luis', importe_centimos: 1083 },
          { orden: 3, comensal: 'Marta', importe_centimos: 1083 },
        ],
      });

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

  it('no emite ningún ticket con las partes intermedias y emite uno único al pagar la última', async () => {
    await prepararConPedido();
    const [ana, luis, marta] = await dividirEnTres();

    const primera = await pagar(ana.id);
    const segunda = await pagar(luis.id);

    expect(primera.body.ticket).toBeNull();
    expect(segunda.body.ticket).toBeNull();
    expect(primera.body.ticket_estado).toBe('no_emitido');
    expect(segunda.body.ticket_estado).toBe('no_emitido');
    expect(db.prepare('SELECT COUNT(*) AS total FROM tickets').get().total).toBe(0);

    const { respuesta, peticion, escrito } = clienteSseFalso();
    suscribir(peticion, respuesta);

    const ultima = await pagar(marta.id);

    expect(ultima.body.ticket_estado).toBe('emitido');
    expect(ultima.body.ticket.partes.map((parte) => parte.comensal)).toEqual([
      'Ana',
      'Luis',
      'Marta',
    ]);
    expect(
      ultima.body.ticket.partes.reduce((suma, parte) => suma + parte.importe_centimos, 0),
    ).toBe(3250);
    expect(escrito.join('')).toContain('event: mesa-cerrada');
    expect(escrito.join('')).toContain('"mesa_id":"mesa-1"');
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('libre');
  });

  it('permite revertir una parte con la mesa abierta y volver a pagarla', async () => {
    await prepararConPedido();
    const [ana, luis, marta] = await dividirEnTres();
    await pagar(ana.id);
    await pagar(luis.id);

    const reversion = await deshacer(luis.id);

    expect(reversion.status).toBe(200);
    expect(reversion.body.parte.estado).toBe('pendiente');
    expect(reversion.body.mesa_abierta).toBe(true);
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('ocupada');

    const deNuevo = await pagar(luis.id);
    expect(deNuevo.body.ticket).toBeNull();

    const ultima = await pagar(marta.id);
    expect(ultima.body.ticket_estado).toBe('emitido');
    expect(ultima.body.ticket.partes).toHaveLength(3);
  });

  it('no permite revertir un pago cuando el ticket ya se emitió', async () => {
    await prepararConPedido();
    const [ana, luis, marta] = await dividirEnTres();
    await pagar(ana.id);
    await pagar(luis.id);
    await pagar(marta.id);

    const respuesta = await deshacer(marta.id);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/cerrada/i);
    expect(db.prepare('SELECT estado FROM cuentas_partes WHERE id = ?').get(marta.id).estado).toBe(
      'pagada',
    );
  });
});
