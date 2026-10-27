import { ErrorHttp } from '../middleware/error.js';

/** Reparte un total en céntimos entre N partes, dando el sobrante a las primeras. */
export function repartirEnPartesIguales(totalCentimos, numeroPartes) {
  if (!Number.isInteger(totalCentimos) || totalCentimos < 0) {
    throw new ErrorHttp(400, 'El total no puede ser negativo');
  }
  if (!Number.isInteger(numeroPartes) || numeroPartes < 1) {
    throw new ErrorHttp(400, 'Debe haber al menos una parte');
  }

  const base = Math.floor(totalCentimos / numeroPartes);
  const sobrante = totalCentimos % numeroPartes;

  return Array.from({ length: numeroPartes }, (_, indice) => base + (indice < sobrante ? 1 : 0));
}

function validarPartes(partes) {
  if (!Array.isArray(partes) || partes.length === 0) {
    throw new ErrorHttp(400, 'La división necesita al menos una parte');
  }

  const ordenes = new Set();
  for (const parte of partes) {
    if (!parte.comensal?.trim()) {
      throw new ErrorHttp(400, 'Cada parte necesita un comensal');
    }
    if (!Number.isInteger(parte.importe_centimos) || parte.importe_centimos < 0) {
      throw new ErrorHttp(400, 'El importe de cada parte debe estar en céntimos enteros');
    }
    if (ordenes.has(parte.orden)) {
      throw new ErrorHttp(400, 'El orden de las partes debe ser único');
    }
    ordenes.add(parte.orden);
  }
}

function validarSuma(totalCentimos, partes) {
  if (totalCentimos === 0) {
    throw new ErrorHttp(422, 'No se puede dividir una cuenta sin importe', 'cuenta_vacia');
  }

  const suma = partes.reduce((total, parte) => total + parte.importe_centimos, 0);
  if (suma !== totalCentimos) {
    throw new ErrorHttp(
      422,
      'La suma de las partes debe coincidir con el total',
      'suma_partes_incorrecta',
    );
  }
}

export function validarDivisionIguales({ totalCentimos, partes }) {
  validarPartes(partes);
  validarSuma(totalCentimos, partes);

  const esperado = repartirEnPartesIguales(totalCentimos, partes.length);
  const ordenadas = [...partes].sort((a, b) => a.orden - b.orden);

  const repartoCorrecto = ordenadas.every(
    (parte, indice) => parte.importe_centimos === esperado[indice],
  );
  if (!repartoCorrecto) {
    throw new ErrorHttp(
      422,
      'Las partes iguales deben repartir el total al céntimo',
      'reparto_desigual',
    );
  }
}

export function validarDivisionPorConsumo({ totalCentimos, consumos, partes, asignaciones }) {
  validarPartes(partes);
  validarSuma(totalCentimos, partes);

  const importePorLinea = new Map(
    consumos.map((consumo) => [consumo.linea_id, consumo.importe_centimos]),
  );
  const ordenesValidos = new Set(partes.map((parte) => parte.orden));
  const cubiertoPorLinea = new Map();
  const cubiertoPorParte = new Map();

  for (const asignacion of asignaciones) {
    if (!importePorLinea.has(asignacion.linea_id)) {
      throw new ErrorHttp(
        422,
        'Hay asignaciones que no corresponden a consumos de la mesa',
        'consumo_desconocido',
      );
    }
    if (!ordenesValidos.has(asignacion.parte_orden)) {
      throw new ErrorHttp(
        422,
        'La asignación apunta a una parte que no existe',
        'parte_desconocida',
      );
    }
    if (!Number.isInteger(asignacion.importe_centimos) || asignacion.importe_centimos < 0) {
      throw new ErrorHttp(400, 'El importe de cada asignación debe estar en céntimos enteros');
    }

    cubiertoPorLinea.set(
      asignacion.linea_id,
      (cubiertoPorLinea.get(asignacion.linea_id) ?? 0) + asignacion.importe_centimos,
    );
    cubiertoPorParte.set(
      asignacion.parte_orden,
      (cubiertoPorParte.get(asignacion.parte_orden) ?? 0) + asignacion.importe_centimos,
    );
  }

  for (const consumo of consumos) {
    if ((cubiertoPorLinea.get(consumo.linea_id) ?? 0) !== consumo.importe_centimos) {
      throw new ErrorHttp(
        422,
        'Las asignaciones deben cubrir exactamente cada consumo',
        'consumos_sin_cubrir',
      );
    }
  }

  for (const parte of partes) {
    if ((cubiertoPorParte.get(parte.orden) ?? 0) !== parte.importe_centimos) {
      throw new ErrorHttp(
        422,
        'El importe de cada parte debe coincidir con sus asignaciones',
        'importe_parte_incorrecto',
      );
    }
  }
}
