import { afterEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('carga de 20 pedidos pendientes', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('devuelve los 20 pedidos ordenados y el más urgente primero', () => {
    db = crearBase();

    for (let indice = 0; indice < 20; indice += 1) {
      const id = `pedido-${String(indice).padStart(2, '0')}`;
      const hora = String(9 + Math.floor(indice / 4)).padStart(2, '0');
      const minuto = String((indice % 4) * 10).padStart(2, '0');
      insertarPedido(db, { id, enviadoEn: `2026-10-20 ${hora}:${minuto}:00` });
      insertarLinea(db, { id: `linea-${indice}`, pedidoId: id });
    }

    const pedidos = listarPedidosPendientes(db, 'entrantes');

    expect(pedidos).toHaveLength(20);
    expect(pedidos[0].id).toBe('pedido-00');
    expect(pedidos[19].id).toBe('pedido-19');
    expect(pedidos[0].enviadoEn < pedidos[19].enviadoEn).toBe(true);
  });
});
