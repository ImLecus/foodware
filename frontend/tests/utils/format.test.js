import { describe, expect, it } from 'vitest';
import {
  formatearEuros,
  formatearFecha,
  formatearFechaLarga,
  formatearPorcentaje,
} from '../../src/utils/format.js';

describe('format.es-ES', () => {
  it('formatea euros en es-ES con €', () => {
    const euros = formatearEuros(123456);
    expect(euros).toContain('€');
  });

  it('formatea fecha en es-ES', () => {
    expect(formatearFecha('2026-10-19')).toBe('19/10/2026');
  });

  it('formatea fecha larga en es-ES', () => {
    const larga = formatearFechaLarga('2026-10-19');
    expect(larga).toContain('octubre');
    expect(larga).toContain('2026');
  });

  it('formatea porcentajes en es-ES con coma decimal y espacio antes del símbolo', () => {
    expect(formatearPorcentaje(9.11)).toBe('9,11 %');
    expect(formatearPorcentaje(-4.76)).toBe('-4,76 %');
    expect(formatearPorcentaje(0)).toBe('0 %');
    expect(formatearPorcentaje(null)).toBe('');
  });
});
