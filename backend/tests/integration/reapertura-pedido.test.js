import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { marcarLinea } from '../../src/services/marcarListo.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('reapertura de pedido al deshacer la última marca', () => {
  let db;

  beforeEach(() => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', platoId: 'plato-entrante-2' });
  });

  afterEach(() => {
    db?.close();
  });

  it('vuelve a listar el pedido con la línea en pendiente', () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-2', estado: 'listo' });

    expect(listarPedidosPendientes(db, 'entrantes')).toEqual([]);

    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-2', estado: 'pendiente' });

    const pedidos = listarPedidosPendientes(db, 'entrantes');
    expect(pedidos.map((pedido) => pedido.id)).toEqual(['pedido-1']);
    const linea = pedidos[0].lineas.find((item) => item.id === 'linea-2');
    expect(linea.estado).toBe('pendiente');
    expect(linea.listoEn).toBeNull();
  });
});
