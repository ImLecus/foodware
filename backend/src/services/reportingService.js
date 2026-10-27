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

function obtenerTotalParaFecha(db, fecha) {
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
    totalCentimos: fila?.totalCentimos ?? 0,
    numeroCuentas: fila?.numeroCuentas ?? 0,
  };
}

export function obtenerTotalDiario(db, fecha) {
  const totales = obtenerTotalParaFecha(db, fecha);
  return {
    fecha,
    numeroCuentas: totales.numeroCuentas,
    totalCentimos: totales.totalCentimos,
  };
}

export function obtenerDesglosePorCamarero(db, fecha) {
  const { inicio, fin } = limitesDelDia(fecha);
  const filas = db
    .prepare(
      `SELECT c.camarero_id AS camareroId, u.nombre, 
              COALESCE(SUM(c.total_centimos), 0) AS importeCentimos,
              COUNT(c.id) AS numeroCuentas
       FROM cuentas c
       LEFT JOIN usuarios u ON u.id = c.camarero_id
       WHERE c.estado = 'cerrada'
         AND c.cerrada_en IS NOT NULL
         AND c.cerrada_en >= ?
         AND c.cerrada_en < ?
       GROUP BY c.camarero_id
       ORDER BY importeCentimos DESC`,
    )
    .all(inicio, fin);
  return filas.map((fila) => ({
    camareroId: fila.camareroId,
    nombre: fila.nombre || fila.camareroId,
    importe: (fila.importeCentimos || 0) / 100,
    numeroCuentas: fila.numeroCuentas || 0,
  }));
}

export function obtenerDesglosePorPlato(db, fecha) {
  const { inicio, fin } = limitesDelDia(fecha);
  const filas = db
    .prepare(
      `SELECT lp.plato_id AS platoId, p.nombre, p.partida_codigo AS partida,
              COALESCE(SUM(lp.cantidad), 0) AS cantidad,
              COALESCE(SUM(lp.cantidad * lp.precio_centimos), 0) AS importeCentimos
       FROM lineas_pedido lp
       JOIN pedidos pd ON pd.id = lp.pedido_id
       JOIN cuentas c ON c.mesa_id = pd.mesa_id AND c.estado = 'cerrada' 
         AND c.cerrada_en >= ? AND c.cerrada_en < ?
       JOIN platos p ON p.id = lp.plato_id
       WHERE pd.enviado_en IS NOT NULL
       GROUP BY lp.plato_id
       ORDER BY importeCentimos DESC`,
    )
    .all(inicio, fin);
  return filas.map((fila) => ({
    platoId: fila.platoId,
    nombre: fila.nombre,
    partida: fila.partida,
    cantidad: fila.cantidad || 0,
    importe: (fila.importeCentimos || 0) / 100,
  }));
}

export function obtenerComparacion(db, fecha) {
  const actual = obtenerTotalParaFecha(db, fecha);
  const diaAnteriorFecha = diaAnterior(fecha);
  const anterior = obtenerTotalParaFecha(db, diaAnteriorFecha);
  
  // Comprobar si existe algún día anterior con datos en el sistema
  const hayDatosAnteriores = db
    .prepare(
      `SELECT 1 FROM cuentas 
       WHERE estado = 'cerrada' AND cerrada_en IS NOT NULL 
         AND DATE(cerrada_en, 'localtime') = ? LIMIT 1`,
    )
    .get(diaAnteriorFecha);
  
  if (hayDatosAnteriores || anterior.totalCentimos > 0 || actual.totalCentimos > 0) {
    const existeCualquierAnterior = db
      .prepare(
        `SELECT 1 FROM cuentas 
         WHERE estado = 'cerrada' AND cerrada_en IS NOT NULL 
           AND DATE(cerrada_en, 'localtime') < ? LIMIT 1`,
      )
      .get(fecha);
    if (existeCualquierAnterior || hayDatosAnteriores || anterior.totalCentimos > 0) {
      const diferenciaImporte = actual.totalCentimos - anterior.totalCentimos;
      if (anterior.totalCentimos === 0 && actual.totalCentimos > 0) {
        return {
          diaActual: fecha,
          diaAnterior: diaAnteriorFecha,
          importeActual: actual.totalCentimos / 100,
          importeAnterior: 0,
          diferenciaImporte: diferenciaImporte / 100,
          diferenciaPorcentaje: null,
          sinBaseComparacion: true,
          tendencia: 'subida',
          porCamarero: [],
          porPlato: [],
        };
      }
    }
  }
  
  const diferenciaImporte = actual.totalCentimos - anterior.totalCentimos;
  let diferenciaPorcentaje = null;
  let sinBaseComparacion = false;
  let tendencia = 'sin_variacion';
  
  if (anterior.totalCentimos === 0 && actual.totalCentimos > 0) {
    sinBaseComparacion = true;
    diferenciaPorcentaje = null;
    tendencia = 'subida';
  } else if (anterior.totalCentimos === 0 && actual.totalCentimos === 0) {
    diferenciaPorcentaje = null;
    sinBaseComparacion = false;
    tendencia = 'sin_variacion';
  } else if (diferenciaImporte === 0) {
    tendencia = 'sin_variacion';
    diferenciaPorcentaje = 0;
  } else if (diferenciaImporte > 0) {
    tendencia = 'subida';
    diferenciaPorcentaje = Number(((diferenciaImporte / anterior.totalCentimos) * 100).toFixed(2));
  } else {
    tendencia = 'bajada';
    diferenciaPorcentaje = Number(((diferenciaImporte / anterior.totalCentimos) * 100).toFixed(2));
  }
  
  return {
    diaActual: fecha,
    diaAnterior: diaAnteriorFecha,
    importeActual: actual.totalCentimos / 100,
    importeAnterior: anterior.totalCentimos / 100,
    diferenciaImporte: diferenciaImporte / 100,
    diferenciaPorcentaje,
    sinBaseComparacion,
    tendencia,
    porCamarero: [],
    porPlato: [],
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
