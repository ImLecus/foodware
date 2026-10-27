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

export async function apiGet(ruta, cabecerasExtra) {
  const headers = cabecerasExtra ? { ...cabeceras(), ...cabecerasExtra } : cabeceras();
  return leerRespuesta(await fetch(`${API_BASE}${ruta}`, { headers }));
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
