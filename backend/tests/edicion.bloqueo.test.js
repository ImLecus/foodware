import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import {
  CABECERA_CAMARERO,
  CABECERA_CAMARERO_2,
  crearAppDePrueba,
  crearPedidoEnviado,
} from './ayuda.js';

describe('Edición · bloqueo', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function prepararEnviado() {
    ({ db, app } = crearAppDePrueba());
    return crearPedidoEnviado(app);
  }

  it('toma el bloqueo al abrir un pedido enviado', async () => {
    const pedidoId = await prepararEnviado();

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.editando_por).toBe('camarero-1');
    expect(respuesta.body.bloqueo).toMatchObject({
      estado: 'bloqueado',
      camarero_id: 'camarero-1',
      inactividad_minutos: 15,
    });
  });

  it('consulta el estado del bloqueo antes y después de abrirlo', async () => {
    const pedidoId = await prepararEnviado();

    const libre = await request(app).get(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    expect(libre.status).toBe(200);
    expect(libre.body.estado).toBe('libre');

    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);

    const bloqueado = await request(app)
      .get(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);
    expect(bloqueado.body.estado).toBe('bloqueado');
    expect(bloqueado.body.camarero_id).toBe('camarero-1');
  });

  it('impide que otro camarero edite un pedido bloqueado', async () => {
    const pedidoId = await prepararEnviado();
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);

    expect(respuesta.status).toBe(423);
    expect(respuesta.body.codigo).toBe('pedido_bloqueado');
  });

  it('impide que otro camarero libere el bloqueo', async () => {
    const pedidoId = await prepararEnviado();
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .delete(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);

    expect(respuesta.status).toBe(423);

    const bloqueo = await request(app)
      .get(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(bloqueo.body.estado).toBe('bloqueado');
  });

  it('libera el bloqueo al salir de la edición', async () => {
    const pedidoId = await prepararEnviado();
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);

    const salida = await request(app)
      .delete(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(salida.status).toBe(204);

    const bloqueo = await request(app)
      .get(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);
    expect(bloqueo.body.estado).toBe('libre');
  });

  it('no permite abrir para editar un pedido en curso', async () => {
    db = crearAppDePrueba().db;
    app = createApp(db);
    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .post(`/api/pedidos/${abierto.body.id}/editar`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('pedido_no_editable');
  });

  it('devuelve 404 si el pedido no existe', async () => {
    ({ db, app } = crearAppDePrueba());

    const consulta = await request(app)
      .get('/api/pedidos/pedido-inexistente/editar')
      .set(CABECERA_CAMARERO);
    const apertura = await request(app)
      .post('/api/pedidos/pedido-inexistente/editar')
      .set(CABECERA_CAMARERO);

    expect(consulta.status).toBe(404);
    expect(apertura.status).toBe(404);
  });
});
