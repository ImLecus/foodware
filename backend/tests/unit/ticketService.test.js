import { afterEach, describe, expect, it } from 'vitest';
import { componerTicket, estadoTicket } from '../../src/services/ticketService.js';
import { crearBaseDePrueba } from '../ayuda.js';

function insertarCuenta(db, { id = 'cuenta-1', modo = 'unico', estado = 'cerrada' } = {}) {
  db.prepare(
    `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, modo_division, cerrada_en)
     VALUES (?, 'mesa-1', ?, 3250, ?, ?)`,
  ).run(id, estado, modo, estado === 'cerrada' ? '2026-10-20 21:05:00' : null);

  return db
    .prepare('SELECT id, mesa_id, estado, total_centimos, modo_division, cerrada_en FROM cuentas WHERE id = ?')
    .get(id);
}

describe('ticketService', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('compone el ticket de una cuenta única con el total y sin partes', () => {
    db = crearBaseDePrueba();
    const cuenta = insertarCuenta(db);

    expect(componerTicket(db, cuenta)).toEqual({
      estado: 'emitido',
      mesa_id: 'mesa-1',
      identificador: 'Mesa 1',
      total_centimos: 3250,
      generado_en: '2026-10-20T21:05:00.000Z',
      partes: [],
    });
  });

  it('incluye el desglose ordenado de las partes de una cuenta dividida', () => {
    db = crearBaseDePrueba();
    const cuenta = insertarCuenta(db, { modo: 'iguales' });
    const insertarParte = db.prepare(
      `INSERT INTO cuentas_partes (id, cuenta_id, orden, comensal, importe_centimos, estado, pagada_en)
       VALUES (?, ?, ?, ?, ?, 'pagada', datetime('now'))`,
    );
    insertarParte.run('parte-2', cuenta.id, 2, 'Luis', 1625);
    insertarParte.run('parte-1', cuenta.id, 1, 'Ana', 1625);

    const ticket = componerTicket(db, cuenta);

    expect(ticket.partes).toEqual([
      { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
      { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
    ]);
    expect(ticket.partes.reduce((suma, parte) => suma + parte.importe_centimos, 0)).toBe(3250);
  });

  it('deriva el estado del ticket del estado de la cuenta', () => {
    expect(estadoTicket({ estado: 'abierta' })).toBe('no_emitido');
    expect(estadoTicket({ estado: 'cerrada' })).toBe('emitido');
    expect(estadoTicket(null)).toBe('no_emitido');
  });
});
