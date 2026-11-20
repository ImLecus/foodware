import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba } from './ayuda.js';

describe('Contrato POST /api/pedidos/{pedidoId}/anular', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function abrirMesa() {
    ({ db, app } = crearAppDePrueba());
    const respuesta = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    return respuesta.body.id;
  }

  it('devuelve 204 al anular un pedido en curso', async () => {
    const pedidoId = await abrirMesa();

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/anular`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(204);
    expect(respuesta.body).toEqual({});
  });

  it('devuelve 404 si el pedido no existe', async () => {
    ({ db, app } = crearAppDePrueba());

    const respuesta = await request(app)
      .post('/api/pedidos/pedido-inexistente/anular')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error).toBeTruthy();
  });

  it('devuelve 409 si el pedido ya fue enviado', async () => {
    const pedidoId = await abrirMesa();
    await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante', cantidad: 1 });
    await request(app).post(`/api/pedidos/${pedidoId}/confirmar`).set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/anular`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/en curso/i);
  });
});
