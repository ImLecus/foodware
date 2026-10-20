import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba, crearPedidoEnviado } from './ayuda.js';

describe('Edición · estado del pedido', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function prepararBloqueado() {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    return pedidoId;
  }

  function consultar(pedidoId) {
    return request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
  }

  it('abrir para editar sin cambios no marca el pedido como modificado', async () => {
    const pedidoId = await prepararBloqueado();

    const pedido = await consultar(pedidoId);

    expect(pedido.body.modificada).toBe(false);
    expect(pedido.body.cambios_pendientes).toBe(false);
    expect(pedido.body.bloqueo).toMatchObject({
      estado: 'bloqueado',
      camarero_id: 'camarero-1',
    });
  });

  it('marca el pedido como modificado al primer cambio real', async () => {
    const pedidoId = await prepararBloqueado();
    const actual = await consultar(pedidoId);

    await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${actual.body.lineas[0].id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 3 });

    const pedido = await consultar(pedidoId);
    expect(pedido.body.modificada).toBe(true);
    expect(pedido.body.cambios_pendientes).toBe(true);
  });

  it('deja de tener cambios pendientes tras enviarlos', async () => {
    const pedidoId = await prepararBloqueado();
    const actual = await consultar(pedidoId);
    await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${actual.body.lineas[0].id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 3 });

    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);
    expect(envio.status).toBe(200);

    const pedido = await consultar(pedidoId);
    expect(pedido.body.modificada).toBe(true);
    expect(pedido.body.cambios_pendientes).toBe(false);
    expect(pedido.body.cambios_enviados_en).toBeTruthy();
    expect(pedido.body.bloqueo.estado).toBe('libre');
  });

  it('impide editar un pedido cerrado', async () => {
    const pedidoId = await prepararBloqueado();
    const actual = await consultar(pedidoId);
    db.prepare("UPDATE pedidos SET estado = 'cerrada' WHERE id = ?").run(pedidoId);

    const respuesta = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${actual.body.lineas[0].id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 3 });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('pedido_no_editable');
  });
});
