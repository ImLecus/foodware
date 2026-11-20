import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  CABECERA_CAMARERO,
  CABECERA_COCINERO,
  crearBaseDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Cuenta cerrada y mesa liberada: escrituras sobre la cuenta anterior (US3/FR-012)', () => {
  let db;
  let app;
  let pedidoId;

  afterEach(() => {
    db?.close();
  });

  async function cerrarCuentaConPedidoEnviado() {
    db = crearBaseDePrueba();
    app = createApp(db);
    pedidoId = await crearPedidoEnviado(app);
    await marcarPedidoListo(app, pedidoId);

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

    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('libre');

    const { id: lineaId } = db
      .prepare('SELECT id FROM lineas_pedido WHERE pedido_id = ? ORDER BY rowid LIMIT 1')
      .get(pedidoId);

    return lineaId;
  }

  function estadoPedido() {
    return db.prepare('SELECT estado, modificado FROM pedidos WHERE id = ?').get(pedidoId);
  }

  it('rechaza añadir, modificar o retirar líneas de la cuenta cerrada y no altera el pedido', async () => {
    const lineaId = await cerrarCuentaConPedidoEnviado();
    const lineasAntes = db
      .prepare('SELECT COUNT(*) AS total FROM lineas_pedido WHERE pedido_id = ?')
      .get(pedidoId).total;

    const anadir = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-postre', cantidad: 1 });
    expect(anadir.status).toBe(409);

    const modificar = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${lineaId}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 2 });
    expect(modificar.status).toBe(409);

    const retirar = await request(app)
      .delete(`/api/pedidos/${pedidoId}/lineas/${lineaId}`)
      .set(CABECERA_CAMARERO);
    expect(retirar.status).toBe(409);

    const lineasDespues = db
      .prepare('SELECT COUNT(*) AS total FROM lineas_pedido WHERE pedido_id = ?')
      .get(pedidoId).total;
    expect(lineasDespues).toBe(lineasAntes);
    expect(estadoPedido()).toMatchObject({ estado: 'cerrada', modificado: 0 });
  });

  it('rechaza abrir la edición, enviar cambios, confirmar y anular la cuenta cerrada', async () => {
    await cerrarCuentaConPedidoEnviado();

    const editar = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(editar.status).toBe(409);

    const enviar = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);
    expect(enviar.status).toBe(409);

    const confirmar = await request(app)
      .post(`/api/pedidos/${pedidoId}/confirmar`)
      .set(CABECERA_CAMARERO);
    expect(confirmar.status).toBe(409);

    const anular = await request(app)
      .post(`/api/pedidos/${pedidoId}/anular`)
      .set(CABECERA_CAMARERO);
    expect(anular.status).toBe(409);

    expect(estadoPedido()).toMatchObject({ estado: 'cerrada' });
  });

  it('rechaza marcar o desmarcar una línea de la cuenta cerrada', async () => {
    const lineaId = await cerrarCuentaConPedidoEnviado();

    const marcar = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${lineaId}/estado`)
      .set(CABECERA_COCINERO)
      .send({ estado: 'pendiente' });
    expect(marcar.status).toBe(409);

    const linea = db.prepare('SELECT estado FROM lineas_pedido WHERE id = ?').get(lineaId);
    expect(linea.estado).toBe('listo');
  });

  it('permite abrir una comanda nueva en la mesa liberada y rechaza escribir en la anterior', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);

    const abrir = await request(app).post('/api/mesas/mesa-2/abrir').set(CABECERA_CAMARERO);
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

    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-2'").get().estado).toBe('libre');

    const nueva = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-postre', cantidad: 1 });
    expect(nueva.status).toBe(409);

    const modificar = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${anadir.body.id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 2 });
    expect(modificar.status).toBe(409);

    const reabrir = await request(app).post('/api/mesas/mesa-2/abrir').set(CABECERA_CAMARERO);
    expect(reabrir.status).toBe(201);
    expect(reabrir.body.estado).toBe('en_curso');
  });
});
