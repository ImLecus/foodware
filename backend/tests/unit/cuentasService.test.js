import { afterEach, describe, expect, it } from 'vitest';
import { calcularTotal, obtenerCuenta } from '../../src/services/cuentasService.js';
import { crearBaseDePrueba } from '../ayuda.js';

describe('cuentasService', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('suma cantidad por precio fijado en el pedido, en céntimos', () => {
    const consumos = [
      { cantidad: 2, precio_centimos: 850 },
      { cantidad: 1, precio_centimos: 1800 },
    ];

    expect(calcularTotal(consumos)).toBe(3500);
  });

  it('devuelve cero cuando la mesa no tiene consumos', () => {
    db = crearBaseDePrueba();

    const cuenta = obtenerCuenta(db, 'mesa-1');

    expect(cuenta.total_centimos).toBe(0);
    expect(cuenta.consumos).toEqual([]);
  });
});
