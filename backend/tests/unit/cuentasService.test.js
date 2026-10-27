import { afterEach, describe, expect, it } from 'vitest';
import {
  calcularTotal,
  listarPlatosPendientes,
  obtenerCuenta,
} from '../../src/services/cuentasService.js';
import { createDb } from '../../src/db/index.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { crearBaseDePrueba } from '../ayuda.js';

describe('cuentasService', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('suma cantidad por precio fijado en el pedido, en céntimos', () => {
    const consumos = [
      { cantidad: 2, precio_centimos: 850 },
      { cantidad: 1, precio_centimos: 1800 },
    ];

    expect(calcularTotal(consumos)).toBe(3500);
  });

  it('resuelve la cuenta por el pedido actual y lista los platos pendientes de cocina', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', estado: 'listo' });

    const cuenta = obtenerCuenta(db, 'mesa-1');

    expect(cuenta.pedido_id).toBe('pedido-1');
    expect(cuenta.platos_pendientes).toEqual([
      { linea_id: 'linea-1', nombre: 'Croquetas', partida: 'entrantes', estado: 'pendiente' },
    ]);
    expect(listarPlatosPendientes(db, 'pedido-1')).toHaveLength(1);
  });

  it('no considera pendientes las líneas de un pedido que aún no se ha enviado', () => {
    db = createDb(':memory:');
    db.prepare(
      "INSERT INTO usuarios (id, nombre, rol) VALUES ('camarero-1', 'Ana', 'camarero')",
    ).run();
    db.prepare(
      "INSERT INTO mesas (id, identificador, estado) VALUES ('mesa-1', 'Mesa 1', 'ocupada')",
    ).run();
    db.prepare(
      "INSERT INTO partidas (codigo, nombre, orden) VALUES ('entrantes', 'Entrantes', 1)",
    ).run();
    db.prepare(
      "INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES ('plato-1', 'Croquetas', 'entrantes', 850)",
    ).run();
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES ('pedido-1', 'mesa-1', 'camarero-1', 'en_curso')",
    ).run();
    db.prepare(
      "INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos) VALUES ('linea-1', 'pedido-1', 'plato-1', 1, 850)",
    ).run();

    expect(listarPlatosPendientes(db, 'pedido-1')).toEqual([]);
  });

  it('devuelve cero cuando la mesa no tiene consumos', () => {
    db = crearBaseDePrueba();

    const cuenta = obtenerCuenta(db, 'mesa-1');

    expect(cuenta.total_centimos).toBe(0);
    expect(cuenta.consumos).toEqual([]);
  });
});
