import { afterEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('servicio de pedidos pendientes', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('ordena por enviadoEn y desempata por id', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-b', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'lb', pedidoId: 'pedido-b' });
    insertarPedido(db, { id: 'pedido-a', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'la', pedidoId: 'pedido-a' });
    insertarPedido(db, { id: 'pedido-c', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'lc', pedidoId: 'pedido-c' });

    const ids = listarPedidosPendientes(db, 'entrantes').map((pedido) => pedido.id);

    expect(ids).toEqual(['pedido-c', 'pedido-a', 'pedido-b']);
  });

  it('excluye pedidos sin líneas pendientes en la partida', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-principal' });
    insertarLinea(db, { id: 'lp', pedidoId: 'pedido-principal', platoId: 'plato-principal' });

    expect(listarPedidosPendientes(db, 'entrantes')).toEqual([]);
  });

  it('deriva el estado pendiente y conserva las líneas listas', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', modificado: 1 });
    insertarLinea(db, { id: 'l1', pedidoId: 'pedido-1', estado: 'listo' });
    insertarLinea(db, { id: 'l2', pedidoId: 'pedido-1', platoId: 'plato-entrante-2' });

    const [pedido] = listarPedidosPendientes(db, 'entrantes');

    expect(pedido.estado).toBe('pendiente');
    expect(pedido.modificado).toBe(true);
    expect(pedido.lineas.map((linea) => linea.estado)).toEqual(['listo', 'pendiente']);
  });
});
