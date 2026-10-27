import { afterEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('tiempo de espera del pedido', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('deriva el tiempo del envío original y no lo reinicia al editar', () => {
    db = crearBase();
    insertarPedido(db, {
      id: 'pedido-editado',
      enviadoEn: '2026-10-20 09:00:00',
      modificado: 1,
    });
    db.prepare("UPDATE pedidos SET modificado_en = '2026-10-20 10:30:00' WHERE id = ?").run(
      'pedido-editado',
    );
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-editado' });

    const [pedido] = listarPedidosPendientes(db, 'entrantes');

    expect(pedido.enviadoEn).toBe('2026-10-20T09:00:00.000Z');
    expect(pedido.modificadoEn).toBe('2026-10-20T10:30:00.000Z');
  });
});
