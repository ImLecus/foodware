import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { diaAnterior, fechaEnMadrid } from '../../src/services/dayTime.js';
import { createDb } from '../../src/db/index.js';
import { CABECERA_CAMARERO, CABECERA_ENCARGADO, insertarSesionesPrueba } from '../helpers/auth.js';

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

function sembrarBase(db) {
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
    'encargado-1',
    'Carmen',
    'encargado',
  );
  db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)').run(
    'mesa-1',
    'Mesa 1',
    'libre',
  );
  db.prepare(
    'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES (?, ?, ?, ?)',
  ).run('plato-1', 'Croquetas', 'entrantes', 850);
}

describe('GET /api/reports/daily', () => {
  let db;
  let app;
  const hoy = fechaEnMadrid();
  const ayer = diaAnterior(hoy);

  beforeEach(() => {
    db = createDb(':memory:');
    limpiarTablas(db);
    sembrarBase(db);
    insertarSesionesPrueba(db);
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('devuelve 401 sin cabecera de identidad', async () => {
    const respuesta = await request(app).get('/api/reports/daily');
    expect(respuesta.status).toBe(401);
  });

  it('devuelve 403 si el usuario no es encargado', async () => {
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-1', 'mesa-1', 850, `${ayer} 10:00:00`, `${ayer} 12:00:00`);
    const respuesta = await request(app).get('/api/reports/daily').set(CABECERA_CAMARERO);
    expect(respuesta.status).toBe(403);
  });

  it('devuelve el total del último día completado con cuentas cerradas', async () => {
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-1', 'mesa-1', 850, `${ayer} 10:00:00`, `${ayer} 12:00:00`);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-2', 'mesa-1', 1700, `${ayer} 11:00:00`, `${ayer} 13:00:00`);
    const respuesta = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.fecha).toBe(ayer);
    expect(respuesta.body.totalVendido).toBe(25.5);
    expect(respuesta.body.numeroCuentas).toBe(2);
    expect(respuesta.body.porCamarero).toEqual([
      { camareroId: 'camarero-1', nombre: 'Ana', importe: 0, numeroCuentas: 0 },
    ]);
    expect(respuesta.body.porPlato).toEqual([
      { platoId: 'plato-1', nombre: 'Croquetas', partida: 'entrantes', cantidad: 0, importe: 0 },
    ]);
    expect(respuesta.body.comparacion).toBeDefined();
  });

  it('ignora las cuentas cerradas hoy y devuelve el día anterior completado', async () => {
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-ayer', 'mesa-1', 850, `${ayer} 10:00:00`, `${ayer} 12:00:00`);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run('cuenta-hoy', 'mesa-1', 1700, `${hoy} 10:00:00`, `${hoy} 12:00:00`);

    const respuesta = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.fecha).toBe(ayer);
    expect(respuesta.body.totalVendido).toBe(8.5);
    expect(respuesta.body.numeroCuentas).toBe(1);
  });

  it('devuelve 0,00 € cuando no hay cuentas cerradas para el día', async () => {
    const respuesta = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.totalVendido).toBe(0);
    expect(respuesta.body.numeroCuentas).toBe(0);
    expect(respuesta.body.porCamarero).toEqual([
      { camareroId: 'camarero-1', nombre: 'Ana', importe: 0, numeroCuentas: 0 },
    ]);
    expect(respuesta.body.porPlato).toEqual([
      { platoId: 'plato-1', nombre: 'Croquetas', partida: 'entrantes', cantidad: 0, importe: 0 },
    ]);
  });

  it('rechaza date con formato inválido con 400', async () => {
    const respuesta = await request(app)
      .get('/api/reports/daily?date=13-10-2026')
      .set(CABECERA_ENCARGADO);
    expect(respuesta.status).toBe(400);
  });

  it('rechaza fecha futura con 400', async () => {
    const respuesta = await request(app)
      .get('/api/reports/daily?date=2099-12-31')
      .set(CABECERA_ENCARGADO);
    expect(respuesta.status).toBe(400);
  });

  it('rechaza el día en curso con 400', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/daily?date=${hoy}`)
      .set(CABECERA_ENCARGADO);
    expect(respuesta.status).toBe(400);
  });
});
