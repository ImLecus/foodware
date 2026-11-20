import { afterEach, describe, expect, it } from 'vitest';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('Cocina · instantánea histórica', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('muestra el nombre y la partida fijados al pedir aunque la carta cambie', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', platoId: 'plato-entrante' });

    db.prepare(
      `UPDATE platos
          SET nombre = 'Croquetas del día', partida_codigo = 'postres'
        WHERE id = 'plato-entrante'`,
    ).run();

    const [pedido] = listarPedidosPendientes(db, 'entrantes');
    expect(pedido.lineas[0]).toMatchObject({
      nombrePlato: 'Croquetas',
      partida: 'entrantes',
    });
  });
});
