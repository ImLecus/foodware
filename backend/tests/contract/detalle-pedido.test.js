import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('Contrato de detalle del pedido de cocina', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('incluye enviadoEn original, mesa y todas las líneas con estado y listoEn', async () => {
    db = crearBase();
    insertarPedido(db, {
      id: 'pedido-detalle',
      mesa: 'mesa-2',
      enviadoEn: '2026-10-20 09:30:00',
    });
    insertarLinea(db, { id: 'linea-lista', pedidoId: 'pedido-detalle', estado: 'listo' });
    insertarLinea(db, {
      id: 'linea-pendiente',
      pedidoId: 'pedido-detalle',
      platoId: 'plato-entrante-2',
      cantidad: 3,
    });

    const respuesta = await request(createApp(db)).get(
      '/api/partidas/entrantes/pedidos-pendientes',
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);

    const pedido = respuesta.body[0];
    expect(pedido.enviadoEn).toBe('2026-10-20T09:30:00.000Z');
    expect(pedido.mesa).toBe(2);
    expect(pedido.lineas).toEqual([
      {
        id: 'linea-lista',
        nombrePlato: 'Croquetas',
        cantidad: 1,
        estado: 'listo',
        listoEn: '2026-10-20T10:05:00.000Z',
      },
      {
        id: 'linea-pendiente',
        nombrePlato: 'Ensalada',
        cantidad: 3,
        estado: 'pendiente',
        listoEn: null,
      },
    ]);
  });

  it('marca modificado y modificadoEn sin reiniciar enviadoEn', async () => {
    db = crearBase();
    insertarPedido(db, {
      id: 'pedido-editado',
      enviadoEn: '2026-10-20 09:00:00',
      modificado: 1,
    });
    db.prepare("UPDATE pedidos SET modificado_en = '2026-10-20 10:30:00' WHERE id = ?").run(
      'pedido-editado',
    );
    insertarLinea(db, { id: 'linea-editada', pedidoId: 'pedido-editado' });

    const respuesta = await request(createApp(db)).get(
      '/api/partidas/entrantes/pedidos-pendientes',
    );

    expect(respuesta.body[0]).toMatchObject({
      id: 'pedido-editado',
      enviadoEn: '2026-10-20T09:00:00.000Z',
      modificadoEn: '2026-10-20T10:30:00.000Z',
      modificado: true,
    });
  });

  it('marca modificado como false cuando no hubo edición posterior', async () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-normal' });
    insertarLinea(db, { id: 'linea-normal', pedidoId: 'pedido-normal' });

    const respuesta = await request(createApp(db)).get(
      '/api/partidas/entrantes/pedidos-pendientes',
    );

    expect(respuesta.body[0]).toMatchObject({ modificado: false, modificadoEn: null });
  });
});
