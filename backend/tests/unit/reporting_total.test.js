import { describe, expect, it } from 'vitest';
import { diaAnterior, fechaEnMadrid, limitesDelDia } from '../../src/services/dayTime.js';
import { createDb } from '../../src/db/index.js';
import { obtenerTotalDiario } from '../../src/services/reportingService.js';

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

describe('obtenerTotalDiario', () => {
  it('suma las cuentas cerradas dentro de los límites del día natural Madrid', () => {
    const db = createDb(':memory:');
    limpiarTablas(db);
    const ayer = diaAnterior(fechaEnMadrid());
    const limites = limitesDelDia(ayer);

    db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)').run(
      'mesa-1',
      'Mesa 1',
      'libre',
    );
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run('c1', 'mesa-1', 850, limites.inicio, limites.inicio.replace('00:00:00', '10:00:00'));
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run('c2', 'mesa-1', 1700, limites.inicio, limites.fin.replace('00:00:00', '23:00:00'));

    const resultado = obtenerTotalDiario(db, ayer);
    expect(resultado.fecha).toBe(ayer);
    expect(resultado.totalCentimos).toBe(2550);
    expect(resultado.numeroCuentas).toBe(2);
    db.close();
  });

  it('devuelve cero cuando no hay cuentas cerradas', () => {
    const db = createDb(':memory:');
    limpiarTablas(db);
    const ayer = diaAnterior(fechaEnMadrid());
    const resultado = obtenerTotalDiario(db, ayer);
    expect(resultado.totalCentimos).toBe(0);
    expect(resultado.numeroCuentas).toBe(0);
    db.close();
  });
});
