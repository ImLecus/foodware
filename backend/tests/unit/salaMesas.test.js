import { afterEach, describe, expect, it } from 'vitest';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { obtenerInstantaneaSala } from '../../src/services/salaMesas.js';

describe('instantánea de sala', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('considera completa una mesa cuando todas sus líneas enviadas están listas', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', estado: 'listo' });

    const sala = obtenerInstantaneaSala(db);

    expect(sala.mesas).toHaveLength(1);
    expect(sala.mesas[0].completa).toBe(true);
  });

  it('no considera completa una mesa sin líneas enviadas', () => {
    db = crearBase();
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES ('pedido-curso', 'mesa-1', 'camarero-1', 'en_curso')",
    ).run();

    const sala = obtenerInstantaneaSala(db);

    expect(sala.mesas[0].completa).toBe(false);
    expect(sala.mesas[0].platos).toEqual([]);
  });

  it('devuelve una lista vacía cuando no hay mesas abiertas', () => {
    db = crearBase();

    const sala = obtenerInstantaneaSala(db);

    expect(sala.mesas).toEqual([]);
  });
});
