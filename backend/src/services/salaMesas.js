import { listarMesasAbiertasParaSala } from '../db/mesas.js';
import { obtenerAvisoActivoDeMesa } from './avisos.js';
import { aISO } from '../utils/fechas.js';

function aISOFecha(valor) {
  if (!valor) return null;
  return aISO(valor);
}

export function obtenerInstantaneaSala(db) {
  const filas = listarMesasAbiertasParaSala(db);

  const mesas = filas.map(({ mesa, pedidoEnviado, pedidoEnCurso, lineas }) => {
    const platos = lineas.map((linea) => ({
      id: linea.id,
      pedido_id: linea.pedido_id,
      plato_id: linea.plato_id,
      nombre: linea.nombre_plato,
      cantidad: linea.cantidad,
      partida: linea.partida,
      estado: linea.estado,
      listo_en: linea.listo_en,
      marcado_en: aISOFecha(linea.listo_en),
    }));

    const completa = lineas.length > 0 && lineas.every((linea) => linea.estado === 'listo');

    return {
      id: mesa.id,
      identificador: mesa.identificador,
      abierta: true,
      en_curso: Boolean(pedidoEnCurso),
      enviada: Boolean(pedidoEnviado),
      completa,
      aviso: completa ? obtenerAvisoActivoDeMesa(db, mesa.id) : null,
      platos,
    };
  });

  return {
    generado_en: new Date().toISOString(),
    mesas,
  };
}
