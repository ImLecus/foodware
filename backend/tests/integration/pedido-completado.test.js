import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { marcarLinea } from '../../src/services/marcarListo.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('pedido completado y desaparición de la lista', () => {
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

  it('desaparece al completar todas las líneas y reaparece al deshacer una', () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });
    expect(listarPedidosPendientes(db, 'entrantes')).toHaveLength(1);

    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-2', estado: 'listo' });
    expect(listarPedidosPendientes(db, 'entrantes')).toEqual([]);

    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-2', estado: 'pendiente' });
    expect(listarPedidosPendientes(db, 'entrantes')).toHaveLength(1);
  });
});
