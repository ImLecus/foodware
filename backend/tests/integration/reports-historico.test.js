import { afterEach, describe, expect, it } from 'vitest';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { obtenerDesglosePorPlato } from '../../src/services/reportingService.js';

describe('Informes · desglose histórico por plato', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('usa el nombre y la partida fijados al pedir aunque la carta cambie', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', platoId: 'plato-entrante' });
    db.prepare(
      `INSERT INTO cuentas
         (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES ('cuenta-1', 'mesa-1', 'pedido-1', 'camarero-1', 'cerrada', 100,
               '2026-10-20 11:00:00', '2026-10-20 12:00:00')`,
    ).run();

    db.prepare(
      `UPDATE platos
          SET nombre = 'Croquetas del día', partida_codigo = 'postres'
        WHERE id = 'plato-entrante'`,
    ).run();

    const fila = obtenerDesglosePorPlato(db, '2026-10-20').find(
      (fila) => fila.nombre === 'Croquetas',
    );
    expect(fila).toMatchObject({ partida: 'entrantes', cantidad: 1 });
  });
});
