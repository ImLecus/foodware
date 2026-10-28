import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { diaAnterior, fechaEnMadrid } from '../../src/services/dayTime.js';
import { createDb } from '../../src/db/index.js';
import { CABECERA_ENCARGADO, insertarSesionesPrueba } from '../helpers/auth.js';

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
    insertarSesionesPrueba(db);
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
    db.prepare("UPDATE cuentas SET pedido_id = 'pedido-1' WHERE id = 'cuenta-1'").run();
    db.prepare("UPDATE cuentas SET pedido_id = 'pedido-2' WHERE id = 'cuenta-2'").run();

    const respuesta = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.porCamarero.length).toBe(2);
    expect(respuesta.body.porPlato.length).toBe(2);

    const porPlato = new Map(respuesta.body.porPlato.map((fila) => [fila.platoId, fila]));
    expect(porPlato.get('plato-1')).toMatchObject({ cantidad: 1, importe: 8.5 });
    expect(porPlato.get('plato-2')).toMatchObject({ cantidad: 1, importe: 22 });
  });

  it('no duplica consumos cuando la misma mesa tiene dos cuentas cerradas', async () => {
    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES ('pedido-reuso-1', 'mesa-1', 'camarero-1', 'enviada', ?)`,
    ).run(`${ayer} 09:00:00`);
    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES ('pedido-reuso-2', 'mesa-1', 'camarero-1', 'enviada', ?)`,
    ).run(`${ayer} 09:30:00`);
    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES ('linea-reuso-1', 'pedido-reuso-1', 'plato-1', 1, 850)`,
    ).run();
    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES ('linea-reuso-2', 'pedido-reuso-2', 'plato-2', 1, 2200)`,
    ).run();
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES ('cuenta-reuso-1', 'mesa-1', 'pedido-reuso-1', 'camarero-1', 'cerrada', 850, ?, ?)`,
    ).run(`${ayer} 10:00:00`, `${ayer} 12:00:00`);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES ('cuenta-reuso-2', 'mesa-1', 'pedido-reuso-2', 'camarero-1', 'cerrada', 2200, ?, ?)`,
    ).run(`${ayer} 10:30:00`, `${ayer} 12:30:00`);

    const respuesta = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);
    const porPlato = new Map(respuesta.body.porPlato.map((fila) => [fila.platoId, fila]));

    expect(porPlato.get('plato-1')).toMatchObject({ cantidad: 1, importe: 8.5 });
    expect(porPlato.get('plato-2')).toMatchObject({ cantidad: 1, importe: 22 });
  });

  it('incluye activos sin ventas, conserva ventas fuera de la carta y ordena por importe y nombre', async () => {
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'camarero-3',
      'Sin ventas',
      'camarero',
    );
    db.prepare(
      'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES (?, ?, ?, ?)',
    ).run('plato-3', 'Postre sin ventas', 'entrantes', 1000);
    db.prepare(
      'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos, activo) VALUES (?, ?, ?, ?, 0)',
    ).run('plato-4', 'Plato retirado', 'entrantes', 1200);
    db.prepare(
      'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES (?, ?, ?, ?)',
    ).run('plato-5', 'Plato agotado', 'entrantes', 900);
    db.prepare('INSERT INTO ingredientes (id, nombre, estado) VALUES (?, ?, ?)').run(
      'ing-1',
      'Marisco',
      'agotado',
    );
    db.prepare('INSERT INTO plato_ingredientes (plato_id, ingrediente_id) VALUES (?, ?)').run(
      'plato-5',
      'ing-1',
    );
    db.prepare(
      'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos, activo) VALUES (?, ?, ?, ?, 0)',
    ).run('plato-6', 'Plato histórico', 'entrantes', 1200);

    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-1', 'mesa-1', 'camarero-1', 850, `${ayer} 10:00:00`, `${ayer} 12:00:00`);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-2', 'mesa-2', 'camarero-2', 2200, `${ayer} 10:00:00`, `${ayer} 12:30:00`);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-3', 'mesa-1', 'camarero-1', 1200, `${ayer} 11:00:00`, `${ayer} 13:00:00`);
    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES ('pedido-1', 'mesa-1', 'camarero-1', 'enviada', ?)`,
    ).run(`${ayer} 09:00:00`);
    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES ('pedido-2', 'mesa-2', 'camarero-2', 'enviada', ?)`,
    ).run(`${ayer} 09:00:00`);
    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES ('pedido-3', 'mesa-1', 'camarero-1', 'enviada', ?)`,
    ).run(`${ayer} 10:00:00`);
    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES ('linea-1', 'pedido-1', 'plato-1', 1, 850)`,
    ).run();
    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES ('linea-2', 'pedido-2', 'plato-2', 1, 2200)`,
    ).run();
    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES ('linea-3', 'pedido-3', 'plato-6', 1, 1200)`,
    ).run();
    db.prepare("UPDATE cuentas SET pedido_id = 'pedido-1' WHERE id = 'cuenta-1'").run();
    db.prepare("UPDATE cuentas SET pedido_id = 'pedido-2' WHERE id = 'cuenta-2'").run();
    db.prepare("UPDATE cuentas SET pedido_id = 'pedido-3' WHERE id = 'cuenta-3'").run();

    const respuesta = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.totalVendido).toBe(42.5);
    expect(respuesta.body.porCamarero.map((fila) => fila.nombre)).toEqual([
      'Luis',
      'Ana',
      'Sin ventas',
    ]);
    expect(
      respuesta.body.porCamarero.find((fila) => fila.camareroId === 'camarero-3'),
    ).toMatchObject({ importe: 0, numeroCuentas: 0 });

    const idsPlatos = respuesta.body.porPlato.map((fila) => fila.platoId);
    expect(idsPlatos).toEqual(['plato-2', 'plato-6', 'plato-1', 'plato-3']);
    expect(idsPlatos).not.toContain('plato-4');
    expect(idsPlatos).not.toContain('plato-5');
    expect(respuesta.body.porPlato.find((fila) => fila.platoId === 'plato-3')).toMatchObject({
      cantidad: 0,
      importe: 0,
    });

    const sumaDesglose = respuesta.body.porPlato.reduce((total, fila) => total + fila.importe, 0);
    expect(sumaDesglose).toBeCloseTo(respuesta.body.totalVendido, 2);
  });
});
