import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CABECERA_CAMARERO,
  crearAppDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Avisos · convergencia 2026-11-03', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    ({ db, app } = crearAppDePrueba());
  }

  function avisosDeMesa(mesaId = 'mesa-1') {
    return db.prepare('SELECT COUNT(*) AS total FROM avisos WHERE mesa_id = ?').get(mesaId).total;
  }

  it('retira el aviso activo al cancelar el pedido', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    await marcarPedidoListo(app, pedidoId);
    expect(avisosDeMesa()).toBe(1);

    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    await request(app).post(`/api/pedidos/${pedidoId}/cancelar`).set(CABECERA_CAMARERO);

    expect(avisosDeMesa()).toBe(0);
  });

  it('retira el aviso si una línea lista sube de cantidad al enviar cambios', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    await marcarPedidoListo(app, pedidoId);
    expect(avisosDeMesa()).toBe(1);

    const detalle = await request(app)
      .get(`/api/pedidos/${pedidoId}`)
      .set(CABECERA_CAMARERO);
    const linea = detalle.body.lineas[0];

    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${linea.id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: linea.cantidad + 1 });
    await request(app).post(`/api/pedidos/${pedidoId}/enviar-cambios`).set(CABECERA_CAMARERO);

    expect(avisosDeMesa()).toBe(0);
  });
});
