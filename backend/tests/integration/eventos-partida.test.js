import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { emitirPedidoNuevo } from '../../src/realtime/emit.js';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import {
  CABECERA_CAMARERO,
  clienteSseFalso,
  crearAppDePrueba,
  crearPedidoEnviado,
} from '../ayuda.js';

function suscribirCanal(partida) {
  const cliente = clienteSseFalso();
  suscribir(cliente.peticion, cliente.respuesta, partida);
  return cliente;
}

describe('eventos SSE por partida', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  async function prepararPedidoEnCurso() {
    ({ db, app } = crearAppDePrueba());
    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    const pedidoId = abierto.body.id;

    for (const plato of ['plato-entrante', 'plato-principal', 'plato-postre']) {
      await request(app)
        .post(`/api/pedidos/${pedidoId}/lineas`)
        .set(CABECERA_CAMARERO)
        .send({ plato_id: plato, cantidad: 1 });
    }

    return pedidoId;
  }

  it('emite pedido.nuevo y pendientes-cambiado en el canal de cada partida al confirmar', async () => {
    const pedidoId = await prepararPedidoEnCurso();
    const canales = {
      entrantes: suscribirCanal('entrantes'),
      principales: suscribirCanal('principales'),
      postres: suscribirCanal('postres'),
    };

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/confirmar`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);

    for (const [partida, cliente] of Object.entries(canales)) {
      const contenido = cliente.escrito.join('');
      expect(contenido).toContain('event: pedido.nuevo');
      expect(contenido).toContain('"tipo":"pedido.nuevo"');
      expect(contenido).toContain(`"partida":"${partida}"`);
      expect(contenido).toContain('event: pedido.pendientes-cambiado');
    }
  });

  it('refresca todas las partidas del pedido al cambiar una línea', async () => {
    const pedidoId = await prepararPedidoEnCurso();
    await request(app).post(`/api/pedidos/${pedidoId}/confirmar`).set(CABECERA_CAMARERO);

    const lineaEntrante = db
      .prepare(
        `SELECT l.id
           FROM lineas_pedido l
           JOIN platos p ON p.id = l.plato_id
          WHERE l.pedido_id = ? AND p.partida_codigo = 'entrantes'`,
      )
      .get(pedidoId);

    const entrantes = suscribirCanal('entrantes');
    const principales = suscribirCanal('principales');
    const postres = suscribirCanal('postres');

    const respuesta = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${lineaEntrante.id}/estado?partida=entrantes`)
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(respuesta.status).toBe(200);
    expect(entrantes.escrito.join('')).toContain('event: linea.actualizada');
    expect(principales.escrito.join('')).not.toContain('event: linea.actualizada');
    expect(postres.escrito.join('')).not.toContain('event: linea.actualizada');

    for (const cliente of [entrantes, principales, postres]) {
      expect(cliente.escrito.join('')).toContain('event: pedido.pendientes-cambiado');
    }
  });

  it('emite pedido.modificado y pendientes-cambiado al enviar cambios', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);

    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante-2', cantidad: 1 });

    const entrantes = suscribirCanal('entrantes');
    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);

    expect(envio.status).toBe(200);

    const contenido = entrantes.escrito.join('');
    expect(contenido).toContain('event: pedido.modificado');
    expect(contenido).toContain('"tipo":"pedido.modificado"');
    expect(contenido).toContain('"partida":"entrantes"');
    expect(contenido).toContain('"modificado":true');
    expect(contenido).toContain('event: pedido.pendientes-cambiado');
  });

  it('emite pendientes-cambiado al anular un pedido', async () => {
    const pedidoId = await prepararPedidoEnCurso();
    const entrantes = suscribirCanal('entrantes');

    const anulacion = await request(app)
      .post(`/api/pedidos/${pedidoId}/anular`)
      .set(CABECERA_CAMARERO);

    expect(anulacion.status).toBe(204);

    const contenido = entrantes.escrito.join('');
    expect(contenido).toContain('event: pedido.pendientes-cambiado');
    expect(contenido).toContain('"partida":"entrantes"');
  });

  it('no entrega a una partida los eventos de otra', () => {
    const entrantes = suscribirCanal('entrantes');
    const principales = suscribirCanal('principales');

    emitirPedidoNuevo({ pedidoId: 'pedido-1', mesa: 1, partida: 'entrantes' });

    expect(entrantes.escrito.join('')).toContain('event: pedido.nuevo');
    expect(principales.escrito.join('')).not.toContain('event: pedido.nuevo');
  });
});
