export const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

function cabeceras(conCuerpo = false) {
  return conCuerpo ? { 'Content-Type': 'application/json' } : {};
}

async function leerRespuesta(respuesta) {
  if (!respuesta.ok) {
    let detalle = 'No se pudo completar la solicitud';
    let codigo = null;
    let cuerpo = null;
    try {
      cuerpo = await respuesta.json();
      detalle = cuerpo.mensaje ?? cuerpo.error ?? detalle;
      codigo = cuerpo.codigo ?? null;
    } catch {
      // La respuesta no era JSON.
    }
    const error = new Error(detalle);
    error.status = respuesta.status;
    error.codigo = codigo;
    error.platos = cuerpo?.platos ?? null;
    throw error;
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

async function peticion(url, opciones = {}) {
  let respuesta;
  try {
    respuesta = await fetch(url, { credentials: 'include', ...opciones });
  } catch (fallo) {
    const error = new Error(MENSAJE_SIN_CONEXION);
    error.codigo = 'sin_conexion';
    error.causa = fallo;
    throw error;
  }
  if (respuesta.status === 401 && !url.endsWith('/auth/login')) {
    window.dispatchEvent(new CustomEvent('foodware:sesion-expirada'));
  }
  return leerRespuesta(respuesta);
}

export async function apiGet(ruta, cabecerasExtra) {
  const headers = cabecerasExtra ? { ...cabeceras(), ...cabecerasExtra } : cabeceras();
  return peticion(`${API_BASE}${ruta}`, { headers });
}

export async function apiEnviar(ruta, metodo, cuerpo) {
  return peticion(`${API_BASE}${ruta}`, {
    method: metodo,
    headers: cabeceras(cuerpo !== undefined),
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
}

/* Autenticación (historia 000) */

export function iniciarSesion(usuario, password) {
  return apiEnviar('/auth/login', 'POST', { usuario, password });
}

export function obtenerSesion() {
  return apiGet('/auth/me');
}

export function cerrarSesion() {
  return apiEnviar('/auth/logout', 'POST');
}

/* Cocina: pedidos pendientes (historia 003) */

export function obtenerPedidosPendientes(partidaId) {
  return apiGet(`/partidas/${encodeURIComponent(partidaId)}/pedidos-pendientes`);
}

export function marcarEstado(pedidoId, lineaId, estado) {
  return apiEnviar(
    `/pedidos/${encodeURIComponent(pedidoId)}/lineas/${encodeURIComponent(lineaId)}/estado`,
    'PUT',
    { estado },
  );
}

export function obtenerEstadoPlatos(mesaId) {
  return apiGet(`/mesas/${encodeURIComponent(mesaId)}/estado-platos`);
}

/* Sala: mesas, carta y pedidos (historia 001) */

export function listarMesas() {
  return apiGet('/mesas');
}

export function abrirMesa(mesaId) {
  return apiEnviar(`/mesas/${mesaId}/abrir`, 'POST');
}

export function listarPlatos() {
  return apiGet('/platos');
}

export function obtenerPedido(pedidoId) {
  return apiGet(`/pedidos/${pedidoId}`);
}

export function anadirLinea(pedidoId, platoId, cantidad = 1) {
  return apiEnviar(`/pedidos/${pedidoId}/lineas`, 'POST', {
    plato_id: platoId,
    cantidad,
  });
}

export function modificarLinea(pedidoId, lineaId, cambios) {
  return apiEnviar(`/pedidos/${pedidoId}/lineas/${lineaId}`, 'PATCH', cambios);
}

export function retirarLinea(pedidoId, lineaId) {
  return apiEnviar(`/pedidos/${pedidoId}/lineas/${lineaId}`, 'DELETE');
}

export function confirmarPedido(pedidoId) {
  return apiEnviar(`/pedidos/${pedidoId}/confirmar`, 'POST');
}

export function anularPedido(pedidoId) {
  return apiEnviar(`/pedidos/${pedidoId}/anular`, 'POST');
}

/* Edición de pedidos enviados (historia 002) */

export function abrirEdicion(pedidoId) {
  return apiEnviar(`/pedidos/${pedidoId}/editar`, 'POST');
}

export function estadoEdicion(pedidoId) {
  return apiGet(`/pedidos/${pedidoId}/editar`);
}

export function cerrarEdicion(pedidoId) {
  return apiEnviar(`/pedidos/${pedidoId}/editar`, 'DELETE');
}

export function enviarCambios(pedidoId) {
  return apiEnviar(`/pedidos/${pedidoId}/enviar-cambios`, 'POST');
}

/* Sala: señales de platos listos (historia 005) */

export function obtenerMesasSala() {
  return apiGet('/sala/mesas');
}

export function cambiarEstadoLineaPedido(pedidoId, lineaId, estado) {
  return apiEnviar(`/pedidos/${pedidoId}/lineas/${lineaId}/estado`, 'PUT', { estado });
}

export function descartarAvisoSala(avisoId) {
  return apiEnviar(`/sala/avisos/${avisoId}/descartar`, 'POST');
}

/* Cuentas (historia 006) */

export function obtenerCuenta(mesaId) {
  return apiGet(`/sala/mesas/${encodeURIComponent(mesaId)}/cuenta`);
}

export function cerrarCuentaUnica(mesaId, totalBaseCentimos) {
  return apiEnviar(`/sala/mesas/${encodeURIComponent(mesaId)}/cuenta/cierre`, 'POST', {
    modo: 'unico',
    total_base_centimos: totalBaseCentimos,
  });
}

export function dividirCuenta(mesaId, division) {
  return apiEnviar(`/sala/mesas/${encodeURIComponent(mesaId)}/cuenta/division`, 'POST', division);
}

export function pagarParte(mesaId, parteId) {
  return apiEnviar(
    `/sala/mesas/${encodeURIComponent(mesaId)}/cuenta/partes/${encodeURIComponent(parteId)}/pago`,
    'POST',
  );
}

export function deshacerPagoParte(mesaId, parteId) {
  return apiEnviar(
    `/sala/mesas/${encodeURIComponent(mesaId)}/cuenta/partes/${encodeURIComponent(parteId)}/pago`,
    'DELETE',
  );
}

export function obtenerTicket(mesaId) {
  return apiGet(`/sala/mesas/${encodeURIComponent(mesaId)}/cuenta/ticket`);
}
