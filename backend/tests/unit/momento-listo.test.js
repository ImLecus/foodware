import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { marcarLinea } from '../../src/services/marcarListo.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('semántica de listoEn', () => {
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

  it('fija el momento al marcar y no lo cambia al re-marcar', () => {
    const primera = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
    });
    const segunda = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
    });

    expect(primera.listoEn).not.toBeNull();
    expect(segunda.listoEn).toBe(primera.listoEn);

    const fila = db.prepare('SELECT listo_en FROM lineas_pedido WHERE id = ?').get('linea-1');
    expect(fila.listo_en).not.toBeNull();
  });

  it('limpia el momento al deshacer la marca', () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });

    const revertida = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'pendiente',
    });

    expect(revertida.listoEn).toBeNull();

    const fila = db.prepare('SELECT listo_en FROM lineas_pedido WHERE id = ?').get('linea-1');
    expect(fila.listo_en).toBeNull();
  });
});
