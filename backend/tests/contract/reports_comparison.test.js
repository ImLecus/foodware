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

describe('GET /api/reports/daily - comparación US3', () => {
  let db;
  let app;
  const hoy = fechaEnMadrid();
  const ayer = diaAnterior(hoy);
  const anteayer = diaAnterior(ayer);

  beforeEach(() => {
    db = createDb(':memory:');
    limpiarTablas(db);
    db.prepare('INSERT INTO partidas (codigo, nombre, orden) VALUES (?, ?, ?)').run(
      'entrantes',
      'Entrantes',
      1,
    );
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'encargado-1',
      'Carmen',
      'encargado',
    );
    db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)').run(
      'camarero-1',
      'Ana',
      'camarero',
    );
    db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)').run(
      'mesa-1',
      'Mesa 1',
      'libre',
    );
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('incluye comparacion con día anterior', async () => {
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('c-ante', 'mesa-1', 'camarero-1', 10000, `${anteayer} 12:00:00`, `${anteayer} 12:00:00`);
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('c-ayer', 'mesa-1', 'camarero-1', 15000, `${ayer} 12:00:00`, `${ayer} 12:00:00`);
    const respuesta = await request(app)
      .get('/api/reports/daily')
      .set('x-usuario-id', 'encargado-1');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.comparacion.diaAnterior).toBe(anteayer);
    expect(respuesta.body.comparacion.tendencia).toBe('subida');
    expect(respuesta.body.comparacion.sinBaseComparacion).toBe(false);
  });

  it('cuando día anterior no tiene ventas y día actual sí, diferencia en euros sin porcentaje y sinBaseComparacion true', async () => {
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
    ).run('c-ayer', 'mesa-1', 'camarero-1', 3500, `${ayer} 12:00:00`, `${ayer} 12:00:00`);
    const respuesta = await request(app)
      .get('/api/reports/daily')
      .set('x-usuario-id', 'encargado-1');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.comparacion.importeAnterior).toBe(0);
    expect(respuesta.body.comparacion.diferenciaImporte).toBe(35);
    expect(respuesta.body.comparacion.diferenciaPorcentaje).toBeNull();
    expect(respuesta.body.comparacion.sinBaseComparacion).toBe(true);
    expect(respuesta.body.comparacion.tendencia).toBe('subida');
  });
});
