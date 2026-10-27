import { describe, expect, it } from 'vitest';
import { formatearEuros, formatearFecha, formatearFechaLarga } from '../../src/utils/format.js';

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
});
