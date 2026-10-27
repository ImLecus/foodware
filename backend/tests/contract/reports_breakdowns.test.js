import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { diaAnterior, fechaEnMadrid } from '../../src/services/dayTime.js';
import { createDb } from '../../src/db/index.js';

function limpiarTablas(db) {
  db.exec(`
    DELETE FROM tickets;
    DELETE FROM cuentas_parte_consumos;
    DELETE FROM cuentas_partes;
    DELETE FROM cuentas;
    DELETE FROM avisos;
    DELETE FROM modificaciones;
    DELETE FROM bloqueos_edicion;
    DELETE FROM lineas_pedido;
    DELETE FROM pedidos;
    DELETE FROM mesas;
    DELETE FROM usuarios;
    DELETE FROM platos;
    DELETE FROM partidas;
  `);
}

describe('GET /api/reports/daily - desgloses US2', () => {
  let db;
  let app;
  const ayer = diaAnterior(fechaEnMadrid());

  beforeEach(() => {
    db = createDb(':memory:');
    limpiarTablas(db);
    db.prepare('INSERT INTO partidas (codigo, nombre, orden) VALUES (?, ?, ?)').run(
      'entrantes',
      'Entrantes',
      1,
    );
    db.prepare('INSERT INTO partidas (codigo, nombre, orden) VALUES (?, ?, ?)').run(
      'principales',
      'Principales',
      2,
    );
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'camarero-1',
      'Ana',
      'camarero',
    );
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'camarero-2',
      'Luis',
      'camarero',
    );
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'encargado-1',
      'Carmen',
      'encargado',
    );
    db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)').run(
      'mesa-1',
      'Mesa 1',
      'libre',
    );
    db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)').run(
      'mesa-2',
      'Mesa 2',
      'libre',
    );
    db.prepare(
      'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES (?, ?, ?, ?)',
    ).run('plato-1', 'Croquetas', 'entrantes', 850);
    db.prepare(
      'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES (?, ?, ?, ?)',
    ).run('plato-2', 'Entrecot', 'principales', 2200);
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('incluye porCamarero y porPlato con los valores agregados', async () => {
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-1', 'mesa-1', 'camarero-1', 850, `${ayer} 10:00:00`, `${ayer} 12:00:00`);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-2', 'mesa-2', 'camarero-2', 2200, `${ayer} 10:00:00`, `${ayer} 12:30:00`);
    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES (?, ?, ?, 'enviada', ?)`,
    ).run('pedido-1', 'mesa-1', 'camarero-1', `${ayer} 09:00:00`);
    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES (?, ?, ?, 'enviada', ?)`,
    ).run('pedido-2', 'mesa-2', 'camarero-2', `${ayer} 09:00:00`);
    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('linea-1', 'pedido-1', 'plato-1', 1, 850);
    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES (?, ?, ?, ?, ?)`,
    ).run('linea-2', 'pedido-2', 'plato-2', 1, 2200);

    const respuesta = await request(app)
      .get('/api/reports/daily')
      .set('x-usuario-id', 'encargado-1');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.porCamarero.length).toBe(2);
    expect(respuesta.body.porPlato.length).toBe(2);
  });
});
