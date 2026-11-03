import { afterEach, describe, expect, it } from 'vitest';
import { crearBase } from '../helpers/fixtures.js';
import {
  obtenerDesglosePorCamarero,
  obtenerTotalDiario,
} from '../../src/services/reportingService.js';

describe('Dashboard · cuenta dividida', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('cuenta una sola vez la cuenta dividida y la atribuye al camarero de apertura', () => {
    db = crearBase();
    db.prepare(
      `INSERT INTO cuentas
         (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, modo_division, cerrada_en)
       VALUES ('cuenta-dividida', 'mesa-1', NULL, 'camarero-1', 'cerrada', 4250, 'iguales',
               '2026-10-20 12:00:00')`,
    ).run();
    db.prepare(
      `INSERT INTO cuentas_partes
         (id, cuenta_id, orden, comensal, importe_centimos, estado, pagada_en)
       VALUES ('parte-1', 'cuenta-dividida', 1, 'Parte 1', 2125, 'pagada', '2026-10-20 12:05:00'),
              ('parte-2', 'cuenta-dividida', 2, 'Parte 2', 2125, 'pagada', '2026-10-20 12:06:00')`,
    ).run();

    const total = obtenerTotalDiario(db, '2026-10-20');
    expect(total).toMatchObject({ totalCentimos: 4250, numeroCuentas: 1 });

    const porCamarero = obtenerDesglosePorCamarero(db, '2026-10-20');
    expect(porCamarero.find((fila) => fila.camareroId === 'camarero-1')).toMatchObject({
      importe: 42.5,
      numeroCuentas: 1,
    });
  });
});
