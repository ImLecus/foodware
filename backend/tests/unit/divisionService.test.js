import { describe, expect, it } from 'vitest';
import {
  repartirEnPartesIguales,
  validarDivisionIguales,
  validarDivisionPorConsumo,
} from '../../src/services/divisionService.js';

function capturar(fn) {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un error de validación');
}

describe('divisionService', () => {
  describe('repartirEnPartesIguales', () => {
    it('reparte los céntimos sobrantes de uno en uno entre las primeras partes', () => {
      expect(repartirEnPartesIguales(4250, 3)).toEqual([1417, 1417, 1416]);
      expect(repartirEnPartesIguales(100, 3)).toEqual([34, 33, 33]);
    });

    it('reparte exacto cuando el total es divisible', () => {
      expect(repartirEnPartesIguales(3000, 2)).toEqual([1500, 1500]);
    });

    it('rechaza un reparto sin partes o con total negativo', () => {
      expect(capturar(() => repartirEnPartesIguales(1000, 0)).status).toBe(400);
      expect(capturar(() => repartirEnPartesIguales(-1, 2)).status).toBe(400);
    });
  });

  describe('validarDivisionIguales', () => {
    it('acepta partes que suman el total repartidas al céntimo', () => {
      expect(() =>
        validarDivisionIguales({
          totalCentimos: 4250,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 1417 },
            { orden: 2, comensal: 'Luis', importe_centimos: 1417 },
            { orden: 3, comensal: 'Marta', importe_centimos: 1416 },
          ],
        }),
      ).not.toThrow();
    });

    it('rechaza que la suma de las partes no coincida con el total', () => {
      const error = capturar(() =>
        validarDivisionIguales({
          totalCentimos: 4250,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 2000 },
            { orden: 2, comensal: 'Luis', importe_centimos: 2000 },
          ],
        }),
      );

      expect(error.status).toBe(422);
      expect(error.message).toMatch(/suma/i);
    });

    it('rechaza un reparto desigual entre partes iguales', () => {
      const error = capturar(() =>
        validarDivisionIguales({
          totalCentimos: 1000,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 700 },
            { orden: 2, comensal: 'Luis', importe_centimos: 300 },
          ],
        }),
      );

      expect(error.status).toBe(422);
      expect(error.message).toMatch(/iguales/i);
    });
  });

  describe('validarDivisionPorConsumo', () => {
    const consumos = [
      { linea_id: 'linea-1', importe_centimos: 1700 },
      { linea_id: 'linea-2', importe_centimos: 2550 },
    ];

    it('acepta asignaciones que cubren exactamente cada consumo', () => {
      expect(() =>
        validarDivisionPorConsumo({
          totalCentimos: 4250,
          consumos,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 1700 },
            { orden: 2, comensal: 'Luis', importe_centimos: 2550 },
          ],
          asignaciones: [
            { parte_orden: 1, linea_id: 'linea-1', importe_centimos: 1700 },
            { parte_orden: 2, linea_id: 'linea-2', importe_centimos: 2550 },
          ],
        }),
      ).not.toThrow();
    });

    it('acepta repartir un plato en porciones entre varias partes', () => {
      expect(() =>
        validarDivisionPorConsumo({
          totalCentimos: 4250,
          consumos,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 850 },
            { orden: 2, comensal: 'Luis', importe_centimos: 3400 },
          ],
          asignaciones: [
            { parte_orden: 1, linea_id: 'linea-1', importe_centimos: 850 },
            { parte_orden: 2, linea_id: 'linea-1', importe_centimos: 850 },
            { parte_orden: 2, linea_id: 'linea-2', importe_centimos: 2550 },
          ],
        }),
      ).not.toThrow();
    });

    it('rechaza un consumo sin cubrir o cubierto de más', () => {
      const sinCubrir = capturar(() =>
        validarDivisionPorConsumo({
          totalCentimos: 4250,
          consumos,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 1700 },
            { orden: 2, comensal: 'Luis', importe_centimos: 2550 },
          ],
          asignaciones: [{ parte_orden: 1, linea_id: 'linea-1', importe_centimos: 1700 }],
        }),
      );
      expect(sinCubrir.status).toBe(422);
      expect(sinCubrir.message).toMatch(/cubrir/i);

      const deMas = capturar(() =>
        validarDivisionPorConsumo({
          totalCentimos: 4250,
          consumos,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 3400 },
            { orden: 2, comensal: 'Luis', importe_centimos: 850 },
          ],
          asignaciones: [
            { parte_orden: 1, linea_id: 'linea-1', importe_centimos: 850 },
            { parte_orden: 1, linea_id: 'linea-1', importe_centimos: 850 },
            { parte_orden: 2, linea_id: 'linea-1', importe_centimos: 850 },
            { parte_orden: 2, linea_id: 'linea-2', importe_centimos: 1700 },
            { parte_orden: 2, linea_id: 'linea-2', importe_centimos: 850 },
          ],
        }),
      );
      expect(deMas.status).toBe(422);
      expect(deMas.message).toMatch(/cubrir/i);
    });

    it('rechaza que el importe de una parte no coincida con sus asignaciones', () => {
      const error = capturar(() =>
        validarDivisionPorConsumo({
          totalCentimos: 4250,
          consumos,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 2000 },
            { orden: 2, comensal: 'Luis', importe_centimos: 2250 },
          ],
          asignaciones: [
            { parte_orden: 1, linea_id: 'linea-1', importe_centimos: 1700 },
            { parte_orden: 2, linea_id: 'linea-2', importe_centimos: 2550 },
          ],
        }),
      );

      expect(error.status).toBe(422);
      expect(error.message).toMatch(/parte/i);
    });

    it('rechaza asignaciones a consumos de otra mesa', () => {
      const error = capturar(() =>
        validarDivisionPorConsumo({
          totalCentimos: 4250,
          consumos,
          partes: [
            { orden: 1, comensal: 'Ana', importe_centimos: 1700 },
            { orden: 2, comensal: 'Luis', importe_centimos: 2550 },
          ],
          asignaciones: [
            { parte_orden: 1, linea_id: 'linea-1', importe_centimos: 1700 },
            { parte_orden: 2, linea_id: 'linea-2', importe_centimos: 2550 },
            { parte_orden: 2, linea_id: 'linea-ajena', importe_centimos: 0 },
          ],
        }),
      );

      expect(error.status).toBe(422);
      expect(error.message).toMatch(/consumo/i);
    });
  });
});
