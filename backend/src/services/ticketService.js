import { aISO } from '../utils/fechas.js';

/** Estado derivado del ticket: solo existe cuando la cuenta está cerrada. */
export function estadoTicket(cuenta) {
  return cuenta?.estado === 'cerrada' ? 'emitido' : 'no_emitido';
}

/** Ticket final de una cuenta cerrada, con el total y el desglose de sus partes. */
export function componerTicket(db, cuenta) {
  if (!cuenta || cuenta.estado !== 'cerrada') return null;

  const mesa = db.prepare('SELECT identificador FROM mesas WHERE id = ?').get(cuenta.mesa_id);
  const partes = db
    .prepare(
      `SELECT orden, comensal, importe_centimos
         FROM cuentas_partes
        WHERE cuenta_id = ?
        ORDER BY orden`,
    )
    .all(cuenta.id)
    .map((parte) => ({
      orden: parte.orden,
      comensal: parte.comensal,
      importe_centimos: parte.importe_centimos,
    }));

  return {
    estado: 'emitido',
    mesa_id: cuenta.mesa_id,
    identificador: mesa?.identificador ?? null,
    total_centimos: cuenta.total_centimos,
    generado_en: aISO(cuenta.cerrada_en),
    partes,
  };
}
