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
    try {
      const cuerpo = await respuesta.json();
      detalle = cuerpo.error ?? detalle;
    } catch {
      // La respuesta no era JSON.
    }
    throw new Error(detalle);
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

export function modificarLinea(pedidoId, lineaId, cantidad) {
  return apiEnviar(`/pedidos/${pedidoId}/lineas/${lineaId}`, 'PATCH', { cantidad });
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
