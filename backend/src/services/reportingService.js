import { diaAnterior, fechaEnMadrid, limitesDelDia } from './dayTime.js';

function fechaMadridDeCierre(valor) {
  if (!valor) return null;
  const fecha = new Date(`${valor.replace(' ', 'T')}Z`);
  return Number.isNaN(fecha.getTime()) ? null : fechaEnMadrid(fecha);
}

function existeCuentaAnteriorA(db, fecha) {
  const { inicio } = limitesDelDia(fecha);
  return Boolean(
    db
      .prepare(
        `SELECT 1 FROM cuentas
          WHERE estado = 'cerrada'
            AND cerrada_en IS NOT NULL
            AND cerrada_en < ?
          LIMIT 1`,
      )
      .get(inicio),
  );
}

function obtenerFechaConsulta(db, fechaParam) {
  if (fechaParam) {
    return fechaParam;
  }
  return obtenerUltimoDiaCompletado(db);
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
      `WITH ventas AS (
         SELECT COALESCE(c.camarero_id, p.camarero_id) AS camarero_id,
                c.total_centimos
           FROM cuentas c
           LEFT JOIN pedidos p ON p.id = c.pedido_id
          WHERE c.estado = 'cerrada'
            AND c.cerrada_en IS NOT NULL
            AND c.cerrada_en >= ?
            AND c.cerrada_en < ?
       ),
       base AS (
         SELECT u.id, u.nombre
           FROM usuarios u
          WHERE u.rol = 'camarero'
         UNION
         SELECT u.id, u.nombre
           FROM usuarios u
           JOIN ventas v ON v.camarero_id = u.id
       )
       SELECT b.id AS camareroId,
              b.nombre,
              COALESCE(SUM(v.total_centimos), 0) AS importeCentimos,
              COUNT(v.camarero_id) AS numeroCuentas
         FROM base b
         LEFT JOIN ventas v ON v.camarero_id = b.id
        GROUP BY b.id, b.nombre
        ORDER BY importeCentimos DESC, b.nombre`,
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
      `WITH base AS (
         SELECT p.id, p.nombre, p.partida_codigo
           FROM platos p
          WHERE p.activo = 1
            AND NOT EXISTS (
              SELECT 1
                FROM plato_ingredientes pi
                JOIN ingredientes i ON i.id = pi.ingrediente_id
               WHERE pi.plato_id = p.id
                 AND i.estado = 'agotado'
            )
         UNION
         SELECT p.id, p.nombre, p.partida_codigo
           FROM platos p
           JOIN lineas_pedido lp ON lp.plato_id = p.id
           JOIN pedidos pd ON pd.id = lp.pedido_id
           JOIN cuentas c ON c.pedido_id = pd.id
          WHERE c.estado = 'cerrada'
            AND c.cerrada_en IS NOT NULL
            AND c.cerrada_en >= ?
            AND c.cerrada_en < ?
       )
       SELECT b.id AS platoId,
              b.nombre,
              b.partida_codigo AS partida,
              COALESCE(SUM(CASE WHEN c.id IS NOT NULL THEN lp.cantidad ELSE 0 END), 0) AS cantidad,
              COALESCE(SUM(CASE WHEN c.id IS NOT NULL THEN lp.cantidad * lp.precio_centimos ELSE 0 END), 0) AS importeCentimos
         FROM base b
         LEFT JOIN lineas_pedido lp ON lp.plato_id = b.id
         LEFT JOIN pedidos pd ON pd.id = lp.pedido_id
         LEFT JOIN cuentas c
           ON c.pedido_id = pd.id
          AND c.estado = 'cerrada'
          AND c.cerrada_en IS NOT NULL
          AND c.cerrada_en >= ?
          AND c.cerrada_en < ?
        GROUP BY b.id, b.nombre, b.partida_codigo
        ORDER BY importeCentimos DESC, b.nombre`,
    )
    .all(inicio, fin, inicio, fin);
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
  const hayDiaAnterior = existeCuentaAnteriorA(db, fecha);

  if (!hayDiaAnterior) {
    return {
      diaActual: fecha,
      diaAnterior: null,
      importeActual: actual.totalCentimos / 100,
      importeAnterior: null,
      diferenciaImporte: null,
      diferenciaPorcentaje: null,
      sinBaseComparacion: false,
      tendencia: 'sin_variacion',
      porCamarero: [],
      porPlato: [],
    };
  }

  const diferenciaImporte = actual.totalCentimos - anterior.totalCentimos;
  const sinBaseComparacion = anterior.totalCentimos === 0 && actual.totalCentimos > 0;
  const diferenciaPorcentaje =
    anterior.totalCentimos > 0
      ? Number(((diferenciaImporte / anterior.totalCentimos) * 100).toFixed(2))
      : null;
  const tendencia =
    diferenciaImporte > 0 ? 'subida' : diferenciaImporte < 0 ? 'bajada' : 'sin_variacion';

  const actualPorCamarero = obtenerDesglosePorCamarero(db, fecha);
  const anteriorPorCamarero = obtenerDesglosePorCamarero(db, diaAnteriorFecha);
  const actualPorPlato = obtenerDesglosePorPlato(db, fecha);
  const anteriorPorPlato = obtenerDesglosePorPlato(db, diaAnteriorFecha);

  const compararCamareros = new Map(anteriorPorCamarero.map((fila) => [fila.camareroId, fila]));
  const compararPlatos = new Map(anteriorPorPlato.map((fila) => [fila.platoId, fila]));

  return {
    diaActual: fecha,
    diaAnterior: diaAnteriorFecha,
    importeActual: actual.totalCentimos / 100,
    importeAnterior: anterior.totalCentimos / 100,
    diferenciaImporte: diferenciaImporte / 100,
    diferenciaPorcentaje,
    sinBaseComparacion,
    tendencia,
    porCamarero: actualPorCamarero.map((fila) => {
      const previa = compararCamareros.get(fila.camareroId);
      const importeAnterior = previa?.importe || 0;
      const diferencia = fila.importe - importeAnterior;
      return {
        camareroId: fila.camareroId,
        nombre: fila.nombre,
        importeActual: fila.importe,
        importeAnterior,
        diferenciaImporte: diferencia,
        diferenciaPorcentaje:
          importeAnterior > 0 ? Number(((diferencia / importeAnterior) * 100).toFixed(2)) : null,
        sinBaseComparacion: importeAnterior === 0 && fila.importe > 0,
        tendencia: diferencia > 0 ? 'subida' : diferencia < 0 ? 'bajada' : 'sin_variacion',
      };
    }),
    porPlato: actualPorPlato.map((fila) => {
      const previa = compararPlatos.get(fila.platoId);
      const importeAnterior = previa?.importe || 0;
      const diferencia = fila.importe - importeAnterior;
      return {
        platoId: fila.platoId,
        nombre: fila.nombre,
        partida: fila.partida,
        importeActual: fila.importe,
        importeAnterior,
        diferenciaImporte: diferencia,
        diferenciaPorcentaje:
          importeAnterior > 0 ? Number(((diferencia / importeAnterior) * 100).toFixed(2)) : null,
        sinBaseComparacion: importeAnterior === 0 && fila.importe > 0,
        tendencia: diferencia > 0 ? 'subida' : diferencia < 0 ? 'bajada' : 'sin_variacion',
      };
    }),
  };
}

export function obtenerUltimoDiaCompletado(db) {
  const hoy = fechaEnMadrid();
  const ayer = diaAnterior(hoy);
  const filas = db
    .prepare(
      `SELECT cerrada_en
         FROM cuentas
        WHERE estado = 'cerrada'
          AND cerrada_en IS NOT NULL`,
    )
    .all();

  const fechas = new Set(filas.map((fila) => fechaMadridDeCierre(fila.cerrada_en)).filter(Boolean));
  const anteriores = [...fechas].filter((fecha) => fecha < hoy).sort();

  return anteriores.at(-1) ?? ayer;
}

export function resolverFechaDiaria(db, fechaParam) {
  return obtenerFechaConsulta(db, fechaParam);
}
