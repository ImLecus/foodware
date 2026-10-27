import { crearAviso, obtenerAvisoVigente, retirarAviso } from '../db/avisos.js';
import { listarEstadosDeLineas, obtenerPedidoEnviadoPorMesa } from '../db/pedidos.js';
import { emitirAvisoActivo, emitirAvisoRetirado } from '../realtime/emit.js';
import { aISO } from '../utils/fechas.js';

function serializarAviso(aviso) {
  if (!aviso) return null;
  return {
    id: aviso.id,
    mesa_id: aviso.mesa_id,
    estado: aviso.estado,
    generado_en: aISO(aviso.generado_en),
  };
}

/**
 * Completitud de una mesa abierta: solo cuentan las líneas de su comanda ya
 * enviada a cocina. Una mesa sin líneas enviadas nunca está completa.
 */
export function calcularCompletitudMesa(db, mesaId) {
  const pedido = obtenerPedidoEnviadoPorMesa(db, mesaId);
  if (!pedido) return { completa: false, total: 0, listos: 0, pedidoId: null };

  const lineas = listarEstadosDeLineas(db, pedido.id);
  const listos = lineas.filter((linea) => linea.estado === 'listo').length;

  return {
    completa: lineas.length > 0 && listos === lineas.length,
    total: lineas.length,
    listos,
    pedidoId: pedido.id,
  };
}

/** Aviso visible (solo `activo`) de una mesa, ya serializado para la API. */
export function obtenerAvisoActivoDeMesa(db, mesaId) {
  const vigente = obtenerAvisoVigente(db, mesaId);
  return vigente?.estado === 'activo' ? serializarAviso(vigente) : null;
}

/**
 * Recalcula la completitud de la mesa y crea o retira su aviso.
 *
 * - Mesa incompleta: si tenía un aviso activo se retira y se difunde
 *   `aviso.retirado`.
 * - Mesa completa sin aviso vigente (o con uno descartado y un plato nuevo
 *   listo): se crea un aviso `activo` y se difunde `aviso.activo`.
 * - Mesa completa con aviso descartado y sin plato nuevo: sigue oculta.
 */
export function sincronizarAvisoMesa(db, mesaId, { nuevoPlatoListo = false } = {}) {
  const { completa } = calcularCompletitudMesa(db, mesaId);
  const vigente = obtenerAvisoVigente(db, mesaId);

  if (!completa) {
    if (vigente?.estado === 'activo') {
      retirarAviso(db, vigente.id);
      emitirAvisoRetirado({ mesaId });
    }
    return { completa: false, aviso: null };
  }

  if (!vigente || (nuevoPlatoListo && vigente.estado === 'descartado')) {
    const aviso = serializarAviso(crearAviso(db, mesaId));
    emitirAvisoActivo({ avisoId: aviso.id, mesaId, generadoEn: aviso.generado_en });
    return { completa: true, aviso };
  }

  if (vigente.estado === 'activo') {
    return { completa: true, aviso: serializarAviso(vigente) };
  }

  return { completa: true, aviso: null };
}
