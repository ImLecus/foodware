export const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function leerRespuesta(respuesta) {
  if (!respuesta.ok) {
    let detalle = respuesta.statusText;
    try {
      const cuerpo = await respuesta.json();
      detalle = cuerpo.error ?? detalle;
    } catch {
      // La respuesta no era JSON.
    }
    throw new Error(`${respuesta.status}: ${detalle}`);
  }
  return respuesta.status === 204 ? null : respuesta.json();
}

export async function apiGet(ruta) {
  return leerRespuesta(await fetch(`${API_BASE}${ruta}`));
}

export async function apiEnviar(ruta, metodo, cuerpo) {
  return leerRespuesta(
    await fetch(`${API_BASE}${ruta}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    }),
  );
}

export function obtenerCocinero(cocineroId) {
  return apiGet(`/cocineros/${encodeURIComponent(cocineroId)}`);
}

export function obtenerPedidosPendientes(partidaId) {
  return apiGet(`/partidas/${encodeURIComponent(partidaId)}/pedidos-pendientes`);
}
