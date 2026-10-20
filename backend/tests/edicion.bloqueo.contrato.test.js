import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CABECERA_CAMARERO,
  CABECERA_CAMARERO_2,
  crearAppDePrueba,
  crearPedidoEnviado,
} from './ayuda.js';

describe('Contrato de /pedidos/{pedidoId}/editar', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function prepararEnviado() {
    ({ db, app } = crearAppDePrueba());
    return crearPedidoEnviado(app);
  }

  it('GET devuelve el estado del bloqueo con el periodo configurado', async () => {
    const pedidoId = await prepararEnviado();

    const respuesta = await request(app)
      .get(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      estado: 'libre',
      inactividad_minutos: 15,
    });
  });

  it('POST devuelve el pedido bloqueado y DELETE responde 204', async () => {
    const pedidoId = await prepararEnviado();

    const apertura = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(apertura.status).toBe(200);
    expect(apertura.body.id).toBe(pedidoId);
    expect(apertura.body.bloqueo.estado).toBe('bloqueado');

    const cierre = await request(app)
      .delete(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(cierre.status).toBe(204);
    expect(cierre.body).toEqual({});
  });

  it('DELETE es idempotente si no hay bloqueo', async () => {
    const pedidoId = await prepararEnviado();

    const primera = await request(app)
      .delete(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    const segunda = await request(app)
      .delete(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);

    expect(primera.status).toBe(204);
    expect(segunda.status).toBe(204);
  });

  it('POST devuelve 423 con código si el pedido está bloqueado por otro', async () => {
    const pedidoId = await prepararEnviado();
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);

    expect(respuesta.status).toBe(423);
    expect(respuesta.body.codigo).toBe('pedido_bloqueado');
    expect(respuesta.body.error).toBeTruthy();
  });

  it('DELETE devuelve 423 con código si el bloqueo es de otro', async () => {
    const pedidoId = await prepararEnviado();
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .delete(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);

    expect(respuesta.status).toBe(423);
    expect(respuesta.body.codigo).toBe('pedido_bloqueado');
  });

  it('POST devuelve 409 con código si el pedido no es editable', async () => {
    const pedidoId = await prepararEnviado();
    db.prepare("UPDATE pedidos SET estado = 'cerrada' WHERE id = ?").run(pedidoId);

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('pedido_no_editable');
  });
});
