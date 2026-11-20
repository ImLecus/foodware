import { describe, expect, it } from 'vitest';
import { diaAnterior, fechaEnMadrid, limitesDelDia } from '../../src/services/dayTime.js';

describe('fechaEnMadrid', () => {
  it('devuelve la fecha natural en Europe/Madrid del instante dado', () => {
    expect(fechaEnMadrid(new Date('2026-07-15T21:30:00Z'))).toBe('2026-07-15');
  });

  it('cambia de día al pasar la medianoche de Madrid (UTC+2 en verano)', () => {
    expect(fechaEnMadrid(new Date('2026-07-15T22:30:00Z'))).toBe('2026-07-16');
  });
});

describe('limitesDelDia', () => {
  it('usa el desfase de verano (UTC+2) en julio', () => {
    expect(limitesDelDia('2026-07-15')).toEqual({
      inicio: '2026-07-14 22:00:00',
      fin: '2026-07-15 22:00:00',
    });
  });

  it('usa el desfase de invierno (UTC+1) en enero', () => {
    expect(limitesDelDia('2026-01-15')).toEqual({
      inicio: '2026-01-14 23:00:00',
      fin: '2026-01-15 23:00:00',
    });
  });

  it('cubre el día de cambio horario de otoño (25 h: +2 -> +1)', () => {
    expect(limitesDelDia('2026-10-25')).toEqual({
      inicio: '2026-10-24 22:00:00',
      fin: '2026-10-25 23:00:00',
    });
  });

  it('cubre el día de cambio horario de primavera (23 h: +1 -> +2)', () => {
    expect(limitesDelDia('2026-03-29')).toEqual({
      inicio: '2026-03-28 23:00:00',
      fin: '2026-03-29 22:00:00',
    });
  });
});

describe('diaAnterior', () => {
  it('resta un día dentro del mismo mes', () => {
    expect(diaAnterior('2026-10-13')).toBe('2026-10-12');
  });

  it('cruza el cambio de mes', () => {
    expect(diaAnterior('2026-11-01')).toBe('2026-10-31');
  });

  it('cruza el cambio de año', () => {
    expect(diaAnterior('2026-01-01')).toBe('2025-12-31');
  });
});
