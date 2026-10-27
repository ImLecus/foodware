import express from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/authorize.js';
import { fechaEnMadrid } from '../services/dayTime.js';
import {
  obtenerDesglosePorCamarero,
  obtenerDesglosePorPlato,
  obtenerTotalDiario,
  obtenerUltimoDiaCompletado,
} from '../services/reportingService.js';

const esquemaFecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido')
  .refine((valor) => {
    const [ano, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(Date.UTC(ano, mes - 1, dia));
    return (
      fecha.getUTCFullYear() === ano &&
      fecha.getUTCMonth() === mes - 1 &&
      fecha.getUTCDate() === dia
    );
  }, 'Fecha inválida');

function centimosAEuros(centimos) {
  return centimos / 100;
}

export function crearReportsRouter(db) {
  const router = express.Router();
  const autorizarEncargado = requireRole(db, 'encargado');

  router.get('/daily', autorizarEncargado, (req, res, next) => {
    try {
      const hoy = fechaEnMadrid();
      const consulta = req.query?.date;

      if (consulta !== undefined) {
        const validado = esquemaFecha.safeParse(consulta);
        if (!validado.success) {
          return res.status(400).json({ error: 'Fecha inválida' });
        }
        const fecha = validado.data;
        if (fecha >= hoy) {
          return res.status(400).json({ error: 'Solo se permiten días naturales completados' });
        }
      }

      const fechaConsulta = consulta
        ? esquemaFecha.parse(consulta)
        : obtenerUltimoDiaCompletado(db);

      if (fechaConsulta >= hoy) {
        return res.status(400).json({ error: 'Solo se permiten días naturales completados' });
      }

      const totales = obtenerTotalDiario(db, fechaConsulta);
      const porCamarero = obtenerDesglosePorCamarero(db, fechaConsulta);
      const porPlato = obtenerDesglosePorPlato(db, fechaConsulta);

      return res.json({
        fecha: fechaConsulta,
        totalVendido: centimosAEuros(totales.totalCentimos),
        numeroCuentas: totales.numeroCuentas,
        porCamarero,
        porPlato,
        comparacion: {
          diaActual: fechaConsulta,
          diaAnterior: null,
          importeActual: centimosAEuros(totales.totalCentimos),
          importeAnterior: null,
          diferenciaImporte: null,
          diferenciaPorcentaje: null,
          sinBaseComparacion: false,
          tendencia: 'sin_variacion',
          porCamarero: [],
          porPlato: [],
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
