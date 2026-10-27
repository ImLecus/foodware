import { afterEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('lista de cocina en vivo', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('inserta un pedido nuevo en la posición que le corresponde por antigüedad', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-a', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'la', pedidoId: 'pedido-a' });
    insertarPedido(db, { id: 'pedido-c', enviadoEn: '2026-10-20 11:00:00' });
    insertarLinea(db, { id: 'lc', pedidoId: 'pedido-c' });

    insertarPedido(db, { id: 'pedido-b', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'lb', pedidoId: 'pedido-b' });

    const ids = listarPedidosPendientes(db, 'entrantes').map((pedido) => pedido.id);

    expect(ids).toEqual(['pedido-a', 'pedido-b', 'pedido-c']);
  });

  it('retira de la lista un pedido cuando todas sus líneas dejan de estar pendientes', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-a', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'la', pedidoId: 'pedido-a' });
    insertarPedido(db, { id: 'pedido-b', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'lb', pedidoId: 'pedido-b' });

    db.prepare(
      "UPDATE lineas_pedido SET estado = 'listo', listo_en = datetime('now') WHERE pedido_id = ?",
    ).run('pedido-a');

    const ids = listarPedidosPendientes(db, 'entrantes').map((pedido) => pedido.id);

    expect(ids).toEqual(['pedido-b']);
  });
});
