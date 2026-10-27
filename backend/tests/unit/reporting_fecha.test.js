import { afterEach, describe, expect, it } from 'vitest';
import { createDb } from '../../src/db/index.js';
import { diaAnterior, fechaEnMadrid } from '../../src/services/dayTime.js';
import {
  obtenerUltimoDiaCompletado,
  resolverFechaDiaria,
} from '../../src/services/reportingService.js';

describe('fecha por defecto del dashboard', () => {
  let db;
  const hoy = fechaEnMadrid();
  const ayer = diaAnterior(hoy);

  afterEach(() => {
    db?.close();
  });

  function prepararCuenta(id, fecha) {
    db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)').run(
      `mesa-${id}`,
      `Mesa ${id}`,
      'libre',
    );
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run(id, `mesa-${id}`, 1000, `${fecha} 10:00:00`, `${fecha} 12:00:00`);
  }

  it('ignora las cuentas cerradas hoy y devuelve el día natural anterior', () => {
    db = createDb(':memory:');
    prepararCuenta('ayer', ayer);
    prepararCuenta('hoy', hoy);

    expect(obtenerUltimoDiaCompletado(db)).toBe(ayer);
    expect(resolverFechaDiaria(db)).toBe(ayer);
  });

  it('interpreta un cierre de madrugada en Europe/Madrid, no en la zona del servidor', () => {
    db = createDb(':memory:');
    const anteayer = diaAnterior(ayer);
    db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)').run(
      'mesa-madrugada',
      'Mesa madrugada',
      'libre',
    );
    // 23:30 UTC del día anterior a ayer = 00:30 Europe/Madrid de ayer.
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES (?, ?, 'cerrada', ?, ?, ?)`,
    ).run(
      'cuenta-madrugada',
      'mesa-madrugada',
      1000,
      `${anteayer} 23:00:00`,
      `${anteayer} 23:30:00`,
    );

    expect(obtenerUltimoDiaCompletado(db)).toBe(ayer);
  });

  it('devuelve ayer cuando todavía no hay cuentas cerradas', () => {
    db = createDb(':memory:');

    expect(obtenerUltimoDiaCompletado(db)).toBe(ayer);
  });

  it('mantiene una fecha explícita sin aplicarle la regla por defecto', () => {
    db = createDb(':memory:');
    prepararCuenta('hoy', hoy);

    expect(resolverFechaDiaria(db, '2026-01-15')).toBe('2026-01-15');
  });
});
