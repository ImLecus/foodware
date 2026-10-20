import { config } from '../config.js';
import { actualizarBloqueo, limpiarBloqueo, renovarBloqueo } from '../db/pedidos.js';
import { ErrorHttp } from '../middleware/error.js';

/** Solo se edita un pedido ya enviado (FR-012). */
export function exigirEditable(pedido) {
  if (pedido.estado !== 'enviada') {
    throw new ErrorHttp(409, 'El pedido no admite cambios', 'pedido_no_editable');
  }
  return pedido;
}

/** Estado observable del bloqueo: libre, bloqueado o expirado (se trata como libre). */
export function estadoBloqueo(pedido) {
  if (!pedido.editando_por) {
    return {
      estado: 'libre',
      camarero_id: null,
      desde: null,
      ultima_actividad: null,
      expira_en: null,
      inactividad_minutos: config.bloqueoInactividadMinutos,
    };
  }

  return {
    estado: pedido.bloqueo_vigente ? 'bloqueado' : 'expirado',
    camarero_id: pedido.editando_por,
    desde: pedido.editando_desde,
    ultima_actividad: pedido.editando_ultima_actividad,
    expira_en: pedido.bloqueo_expira_en,
    inactividad_minutos: config.bloqueoInactividadMinutos,
  };
}

/** Toma el bloqueo (o lo renueva si ya era del mismo camarero). */
export function adquirirBloqueoEdicion(db, pedido, camareroId) {
  exigirEditable(pedido);
  const bloqueo = estadoBloqueo(pedido);

  if (bloqueo.estado === 'bloqueado' && bloqueo.camarero_id !== camareroId) {
    throw new ErrorHttp(423, 'El pedido está siendo editado por otro camarero', 'pedido_bloqueado');
  }

  if (bloqueo.estado === 'expirado') {
    limpiarBloqueo(db, pedido.id);
  }

  actualizarBloqueo(db, pedido.id, camareroId, config.bloqueoInactividadMinutos);
}

/** Exige que el camarero tenga el bloqueo vigente para modificar el pedido. */
export function exigirBloqueoPropio(pedido, camareroId) {
  const bloqueo = estadoBloqueo(pedido);

  if (bloqueo.estado === 'bloqueado' && bloqueo.camarero_id !== camareroId) {
    throw new ErrorHttp(423, 'El pedido está siendo editado por otro camarero', 'pedido_bloqueado');
  }

  if (bloqueo.estado !== 'bloqueado' || bloqueo.camarero_id !== camareroId) {
    throw new ErrorHttp(
      409,
      'El bloqueo de edición ha expirado; vuelve a abrir el pedido',
      'bloqueo_expirado',
    );
  }
}

/** Refresca la actividad del bloqueo al guardar un cambio. */
export function renovarBloqueoEdicion(db, pedidoId) {
  renovarBloqueo(db, pedidoId, config.bloqueoInactividadMinutos);
}

/** Libera el bloqueo; es idempotente si no hay bloqueo o ya expiró. */
export function liberarBloqueoEdicion(db, pedido, camareroId) {
  const bloqueo = estadoBloqueo(pedido);

  if (bloqueo.estado === 'bloqueado' && bloqueo.camarero_id !== camareroId) {
    throw new ErrorHttp(423, 'El pedido está bloqueado por otro camarero', 'pedido_bloqueado');
  }

  limpiarBloqueo(db, pedido.id);
}
