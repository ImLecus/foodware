import { afterEach, describe, expect, it } from 'vitest';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { obtenerLinea } from '../../src/db/pedidos.js';
import { cambiarEstadoLinea } from '../../src/services/estadoLinea.js';

describe('marcado de línea como lista', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('marca la línea como lista y fija listo_en', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });

    cambiarEstadoLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });

    const linea = obtenerLinea(db, 'linea-1');
    expect(linea.estado).toBe('listo');
    expect(linea.listo_en).not.toBeNull();
  });

  it('deshace la marca y limpia listo_en', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', estado: 'listo' });

    cambiarEstadoLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'pendiente' });

    const linea = obtenerLinea(db, 'linea-1');
    expect(linea.estado).toBe('pendiente');
    expect(linea.listo_en).toBeNull();
  });

  it('rechaza marcar una línea de un pedido que no está enviado', () => {
    db = crearBase();
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES ('pedido-curso', 'mesa-1', 'camarero-1', 'en_curso')",
    ).run();
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-curso' });

    expect(() =>
      cambiarEstadoLinea(db, { pedidoId: 'pedido-curso', lineaId: 'linea-1', estado: 'listo' }),
    ).toThrowError(/enviada|enviad/i);
  });
});
