import { afterEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('marca de pedido modificado', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('deriva modificado de modificadoEn no nulo', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-editado', modificado: 1 });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-editado' });

    const [pedido] = listarPedidosPendientes(db, 'entrantes');

    expect(pedido.modificado).toBe(true);
    expect(pedido.modificadoEn).not.toBeNull();
  });

  it('devuelve modificado false cuando no hay edición', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-normal' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-normal' });

    const [pedido] = listarPedidosPendientes(db, 'entrantes');

    expect(pedido.modificado).toBe(false);
    expect(pedido.modificadoEn).toBeNull();
  });
});
