import { diaAnterior, fechaEnMadrid, limitesDelDia } from './dayTime.js';

function obtenerFechaConsulta(db, fechaParam) {
  if (fechaParam) {
    return fechaParam;
  }
  const hoy = fechaEnMadrid();
  const ultimoCierre = db
    .prepare(
      `SELECT DATE(cerrada_en, 'localtime') AS fecha, MAX(cerrada_en) AS ultima
       FROM cuentas
       WHERE estado = 'cerrada' AND cerrada_en IS NOT NULL
       GROUP BY DATE(cerrada_en, 'localtime')
       ORDER BY DATE(cerrada_en, 'localtime') DESC
       LIMIT 1`,
    )
    .get();
  if (ultimoCierre?.fecha) {
    return ultimoCierre.fecha;
  }
  return diaAnterior(hoy);
}

export function obtenerTotalDiario(db, fecha) {
  const { inicio, fin } = limitesDelDia(fecha);
  const fila = db
    .prepare(
      `SELECT COUNT(*) AS numeroCuentas, COALESCE(SUM(total_centimos), 0) AS totalCentimos
       FROM cuentas
       WHERE estado = 'cerrada'
         AND cerrada_en IS NOT NULL
         AND cerrada_en >= ?
         AND cerrada_en < ?`,
    )
    .get(inicio, fin);
  return {
    fecha,
    numeroCuentas: fila?.numeroCuentas ?? 0,
    totalCentimos: fila?.totalCentimos ?? 0,
  };
}

export function obtenerUltimoDiaCompletado(db) {
  const hoy = fechaEnMadrid();
  const ultimoCierre = db
    .prepare(
      `SELECT DATE(cerrada_en, 'localtime') AS fecha
       FROM cuentas
       WHERE estado = 'cerrada' AND cerrada_en IS NOT NULL
       GROUP BY DATE(cerrada_en, 'localtime')
       ORDER BY DATE(cerrada_en, 'localtime') DESC
       LIMIT 1`,
    )
    .get();
  if (ultimoCierre?.fecha) {
    return ultimoCierre.fecha;
  }
  return diaAnterior(hoy);
}

export function resolverFechaDiaria(db, fechaParam) {
  return obtenerFechaConsulta(db, fechaParam);
}
