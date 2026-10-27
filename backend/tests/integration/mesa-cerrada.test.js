import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { CABECERA_CAMARERO, crearBaseDePrueba, crearPedidoEnviado } from '../ayuda.js';

describe('Mesa cerrada: rechazo de escrituras sobre sus pedidos (US3/FR-012)', () => {
  let db;
  let app;
  let pedidoId;

  afterEach(() => {
    db?.close();
  });

  async function cerrarMesaConPedidoEnviado() {
    db = crearBaseDePrueba();
    app = createApp(db);
    pedidoId = await crearPedidoEnviado(app);

    // El camarero toma el bloqueo antes del cierre; después ya no podrá editar.
    const bloqueo = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(bloqueo.status).toBe(200);

    const cierre = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });
    expect(cierre.status).toBe(201);

    const { id: lineaId } = db
      .prepare('SELECT id FROM lineas_pedido WHERE pedido_id = ? ORDER BY rowid LIMIT 1')
      .get(pedidoId);

    return lineaId;
  }

  function estadoPedido() {
    return db
      .prepare('SELECT estado, modificado FROM pedidos WHERE id = ?')
      .get(pedidoId);
  }

  it('rechaza con 409 añadir, modificar o retirar líneas y no altera el pedido', async () => {
    const lineaId = await cerrarMesaConPedidoEnviado();
    const lineasAntes = db
      .prepare('SELECT COUNT(*) AS total FROM lineas_pedido WHERE pedido_id = ?')
      .get(pedidoId).total;

    const anadir = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-postre', cantidad: 1 });
    expect(anadir.status).toBe(409);
    expect(anadir.body.error).toMatch(/cerrada/i);

    const modificar = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${lineaId}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 2 });
    expect(modificar.status).toBe(409);
    expect(modificar.body.error).toMatch(/cerrada/i);

    const retirar = await request(app)
      .delete(`/api/pedidos/${pedidoId}/lineas/${lineaId}`)
      .set(CABECERA_CAMARERO);
    expect(retirar.status).toBe(409);
    expect(retirar.body.error).toMatch(/cerrada/i);

    const lineasDespues = db
      .prepare('SELECT COUNT(*) AS total FROM lineas_pedido WHERE pedido_id = ?')
      .get(pedidoId).total;
    expect(lineasDespues).toBe(lineasAntes);
    expect(estadoPedido()).toMatchObject({ estado: 'enviada', modificado: 0 });
  });

  it('rechaza con 409 abrir la edición, enviar cambios, confirmar y anular', async () => {
    await cerrarMesaConPedidoEnviado();

    const editar = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(editar.status).toBe(409);
    expect(editar.body.error).toMatch(/cerrada/i);

    const enviar = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);
    expect(enviar.status).toBe(409);
    expect(enviar.body.error).toMatch(/cerrada/i);

    const confirmar = await request(app)
      .post(`/api/pedidos/${pedidoId}/confirmar`)
      .set(CABECERA_CAMARERO);
    expect(confirmar.status).toBe(409);
    expect(confirmar.body.error).toMatch(/cerrada/i);

    const anular = await request(app)
      .post(`/api/pedidos/${pedidoId}/anular`)
      .set(CABECERA_CAMARERO);
    expect(anular.status).toBe(409);
    expect(anular.body.error).toMatch(/cerrada/i);

    expect(estadoPedido()).toMatchObject({ estado: 'enviada' });
  });

  it('rechaza con 409 marcar o desmarcar una línea como lista', async () => {
    const lineaId = await cerrarMesaConPedidoEnviado();

    const marcar = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${lineaId}/estado?partida=entrantes`)
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });
    expect(marcar.status).toBe(409);
    expect(marcar.body.error).toMatch(/cerrada/i);

    const linea = db
      .prepare('SELECT estado FROM lineas_pedido WHERE id = ?')
      .get(lineaId);
    expect(linea.estado).not.toBe('listo');
  });

  it('rechaza con 409 editar un pedido en curso de una mesa cerrada', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);

    const abrir = await request(app)
      .post('/api/mesas/mesa-2/abrir')
      .set(CABECERA_CAMARERO);
    expect(abrir.status).toBe(201);
    pedidoId = abrir.body.id;

    const anadir = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-principal', cantidad: 1 });
    expect(anadir.status).toBe(201);

    const cierre = await request(app)
      .post('/api/sala/mesas/mesa-2/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 1800 });
    expect(cierre.status).toBe(201);

    const nueva = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-postre', cantidad: 1 });
    expect(nueva.status).toBe(409);
    expect(nueva.body.error).toMatch(/cerrada/i);

    const modificar = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${anadir.body.id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 2 });
    expect(modificar.status).toBe(409);
    expect(modificar.body.error).toMatch(/cerrada/i);

    const retirar = await request(app)
      .delete(`/api/pedidos/${pedidoId}/lineas/${anadir.body.id}`)
      .set(CABECERA_CAMARERO);
    expect(retirar.status).toBe(409);
    expect(retirar.body.error).toMatch(/cerrada/i);
  });
});
