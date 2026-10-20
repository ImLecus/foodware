export const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

// La autenticación queda fuera del alcance de la historia 001: se reutiliza la
// sesión existente y el camarero se identifica con esta cabecera.
export const CAMARERO_ID = import.meta.env.VITE_CAMARERO_ID ?? 'camarero-1';

function cabeceras(conCuerpo = false) {
  const cabecera = { 'X-Camarero-Id': CAMARERO_ID };
  if (conCuerpo) {
    cabecera['Content-Type'] = 'application/json';
  }
  return cabecera;
}

async function leerRespuesta(respuesta) {
  if (!respuesta.ok) {
    let detalle = respuesta.statusText;
    let codigo = null;
    try {
      const cuerpo = await respuesta.json();
      detalle = cuerpo.error ?? detalle;
      codigo = cuerpo.codigo ?? null;
    } catch {
      // La respuesta no era JSON.
    }
    const error = new Error(detalle);
    error.status = respuesta.status;
    error.codigo = codigo;
    throw error;
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

export async function apiGet(ruta) {
  return leerRespuesta(await fetch(`${API_BASE}${ruta}`, { headers: cabeceras() }));
}

export async function apiEnviar(ruta, metodo, cuerpo) {
  return leerRespuesta(
    await fetch(`${API_BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras(cuerpo !== undefined),
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    }),
  );
}

/* Cocina: pedidos pendientes (historia 003) */

export function obtenerCocinero(cocineroId) {
  return apiGet(`/cocineros/${encodeURIComponent(cocineroId)}`);
}

export function obtenerPedidosPendientes(partidaId) {
  return apiGet(`/partidas/${encodeURIComponent(partidaId)}/pedidos-pendientes`);
}

export function marcarEstado(pedidoId, lineaId, estado, partidaId) {
  const consulta = partidaId ? `?partida=${encodeURIComponent(partidaId)}` : '';
  return apiEnviar(
    `/pedidos/${encodeURIComponent(pedidoId)}/lineas/${encodeURIComponent(lineaId)}/estado${consulta}`,
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
