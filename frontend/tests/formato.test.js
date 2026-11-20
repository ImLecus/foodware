import { describe, expect, it } from 'vitest';
import { formatearEuros, formatearFecha, formatearHora } from '../src/utils/formato.js';

describe('formato es-ES', () => {
  it('formatea los importes en euros con coma decimal', () => {
    const texto = formatearEuros(850);

    expect(texto).toMatch(/8,50/);
    expect(texto).toContain('€');
  });

  it('formatea fechas y horas con la convención española', () => {
    const fecha = new Date('2026-10-20T13:45:00Z');

    expect(formatearFecha(fecha)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    expect(formatearHora(fecha)).toMatch(/^\d{2}:\d{2}$/);
  });
});
