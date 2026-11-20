import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba, crearPedidoEnviado } from './ayuda.js';

describe('Edición · líneas de un pedido enviado', () => {
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

  function pedido(pedidoId) {
    return request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
  }

  function modificaciones(pedidoId) {
    return db
      .prepare('SELECT tipo, linea_id FROM modificaciones WHERE pedido_id = ? ORDER BY rowid')
      .all(pedidoId);
  }

  it('no permite modificar líneas sin el bloqueo de edición', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante-2', cantidad: 1 });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('bloqueo_expirado');
  });

  it('añade un plato y marca el pedido como modificado con cambios pendientes', async () => {
    const pedidoId = await prepararBloqueado();

    const alta = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante-2', cantidad: 2, indicaciones: 'Sin sal' });

    expect(alta.status).toBe(201);
    expect(alta.body).toMatchObject({ cantidad: 2, indicaciones: 'Sin sal' });

    const actualizado = await pedido(pedidoId);
    expect(actualizado.body.modificada).toBe(true);
    expect(actualizado.body.cambios_pendientes).toBe(true);
    expect(actualizado.body.lineas).toHaveLength(4);

    expect(modificaciones(pedidoId).map((fila) => fila.tipo)).toContain('anadir');
  });

  it('ajusta la cantidad y corrige las indicaciones de una línea', async () => {
    const pedidoId = await prepararBloqueado();
    const actual = await pedido(pedidoId);
    const linea = actual.body.lineas[0];

    const cantidad = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${linea.id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 4 });
    expect(cantidad.status).toBe(200);
    expect(cantidad.body.cantidad).toBe(4);

    const indicaciones = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${linea.id}`)
      .set(CABECERA_CAMARERO)
      .send({ indicaciones: 'Sin cebolla' });
    expect(indicaciones.status).toBe(200);
    expect(indicaciones.body.indicaciones).toBe('Sin cebolla');

    const tipos = modificaciones(pedidoId).map((fila) => fila.tipo);
    expect(tipos).toContain('ajustar_cantidad');
    expect(tipos).toContain('corregir');

    const actualizado = await pedido(pedidoId);
    expect(actualizado.body.modificada).toBe(true);
    expect(actualizado.body.cambios_pendientes).toBe(true);
  });

  it('retira un plato del pedido vigente', async () => {
    const pedidoId = await prepararBloqueado();
    const actual = await pedido(pedidoId);
    const linea = actual.body.lineas[0];

    const retirada = await request(app)
      .delete(`/api/pedidos/${pedidoId}/lineas/${linea.id}`)
      .set(CABECERA_CAMARERO);
    expect(retirada.status).toBe(204);

    const actualizado = await pedido(pedidoId);
    expect(actualizado.body.lineas).toHaveLength(2);
    expect(actualizado.body.lineas.map((fila) => fila.id)).not.toContain(linea.id);
    expect(modificaciones(pedidoId).map((fila) => fila.tipo)).toContain('retirar');
  });

  it('impide dejar el pedido sin ningún plato', async () => {
    const pedidoId = await prepararBloqueado();
    let actual = await pedido(pedidoId);

    while (actual.body.lineas.length > 1) {
      await request(app)
        .delete(`/api/pedidos/${pedidoId}/lineas/${actual.body.lineas[0].id}`)
        .set(CABECERA_CAMARERO);
      actual = await pedido(pedidoId);
    }

    const ultima = await request(app)
      .delete(`/api/pedidos/${pedidoId}/lineas/${actual.body.lineas[0].id}`)
      .set(CABECERA_CAMARERO);

    expect(ultima.status).toBe(409);
    expect(ultima.body.codigo).toBe('pedido_vacio');
  });

  it('mantiene la edición de pedidos en curso del flujo de la historia 001', async () => {
    ({ db, app } = crearAppDePrueba());
    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    const alta = await request(app)
      .post(`/api/pedidos/${abierto.body.id}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante', cantidad: 1 });

    expect(alta.status).toBe(201);
  });
});
