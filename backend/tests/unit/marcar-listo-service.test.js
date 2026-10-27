import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { marcarLinea } from '../../src/services/marcarListo.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('servicio de marcar/deshacer platos', () => {
  let db;

  beforeEach(() => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, {
      id: 'linea-2',
      pedidoId: 'pedido-1',
      platoId: 'plato-entrante-2',
      cantidad: 2,
    });
  });

  afterEach(() => {
    db?.close();
  });

  it('marca una línea y deja las demás pendientes', () => {
    const linea = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
      partida: 'entrantes',
    });

    expect(linea).toMatchObject({
      id: 'linea-1',
      pedidoId: 'pedido-1',
      estado: 'listo',
      pedidoCompletado: false,
    });
    expect(linea.listoEn).not.toBeNull();

    const otra = db.prepare('SELECT estado FROM lineas_pedido WHERE id = ?').get('linea-2');
    expect(otra.estado).toBe('pendiente');
  });

  it('es idempotente al volver a marcar como listo', () => {
    const primera = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
      partida: 'entrantes',
    });
    const segunda = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
      partida: 'entrantes',
    });

    expect(segunda.listoEn).toBe(primera.listoEn);
  });

  it('mantiene un único listoEn tras dos marcas de la misma línea', () => {
    const primera = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
      partida: 'entrantes',
    });
    const segunda = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
      partida: 'entrantes',
    });

    const fila = db
      .prepare('SELECT COUNT(*) AS total, MIN(listo_en) AS listo FROM lineas_pedido WHERE id = ?')
      .get('linea-1');

    expect(fila.total).toBe(1);
    expect(fila.listo).toBe(primera.listoEn);
    expect(segunda.listoEn).toBe(primera.listoEn);
  });

  it('indica que el pedido se completa al marcar la última línea', () => {
    marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
      partida: 'entrantes',
    });

    const ultima = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-2',
      estado: 'listo',
      partida: 'entrantes',
    });

    expect(ultima.pedidoCompletado).toBe(true);
  });

  it('deshacer la última marca reabre el pedido y limpia listoEn', () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-2', estado: 'listo' });

    const revertida = marcarLinea(db, {
      pedidoId: 'pedido-1',
      lineaId: 'linea-2',
      estado: 'pendiente',
    });

    expect(revertida.estado).toBe('pendiente');
    expect(revertida.listoEn).toBeNull();
    expect(revertida.pedidoReabierto).toBe(true);
  });

  it('rechaza marcar una línea de otra partida con 403', () => {
    expect(() =>
      marcarLinea(db, {
        pedidoId: 'pedido-1',
        lineaId: 'linea-1',
        estado: 'listo',
        partida: 'principales',
      }),
    ).toThrowError(expect.objectContaining({ status: 403, codigo: 'partida_ajena' }));
  });

  it('rechaza marcar como listo un pedido completado con 409', () => {
    db.prepare("UPDATE lineas_pedido SET estado = 'listo', listo_en = datetime('now')").run();

    expect(() =>
      marcarLinea(db, {
        pedidoId: 'pedido-1',
        lineaId: 'linea-1',
        estado: 'listo',
      }),
    ).toThrowError(expect.objectContaining({ status: 409 }));
  });
});
