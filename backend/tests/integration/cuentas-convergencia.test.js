import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba, crearPedidoEnviado } from '../ayuda.js';
import { listarConsumos } from '../../src/services/cuentasService.js';

describe('Cuentas · convergencia 2026-11-03', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    ({ db, app } = crearAppDePrueba());
  }

  it('un pedido cancelado no genera consumos facturables', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    await request(app).post(`/api/pedidos/${pedidoId}/cancelar`).set(CABECERA_CAMARERO);

    expect(listarConsumos(db, pedidoId)).toEqual([]);
  });

  it('bloquea la edición si hay una parte pagada', async () => {
    preparar();
    const pedidoId = await crearPedidoEnviado(app);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, pedido_id, estado, total_centimos, modo_division)
       VALUES ('cuenta-test', 'mesa-1', ?, 'abierta', 100, 'iguales')`,
    ).run(pedidoId);
    db.prepare(
      `INSERT INTO cuentas_partes
         (id, cuenta_id, orden, comensal, importe_centimos, estado, pagada_en)
       VALUES ('parte-test', 'cuenta-test', 1, 'Parte 1', 100, 'pagada', datetime('now'))`,
    ).run();

    const respuesta = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('partes_pagadas');
  });
});
