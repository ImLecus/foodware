import { API_BASE } from './api.js';

export async function obtenerCartaAdmin(cabeceras = {}) {
  const res = await fetch(`${API_BASE}/admin/platos`, { headers: cabeceras });
  if (!res.ok) throw new Error('Error al obtener carta');
  return res.json();
}

export async function crearPlato(datos, cabeceras = {}) {
  const res = await fetch(`${API_BASE}/admin/platos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cabeceras },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al crear plato');
  }
  return res.json();
}

export async function actualizarPlato(id, datos, cabeceras = {}) {
  const res = await fetch(`${API_BASE}/admin/platos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...cabeceras },
    body: JSON.stringify(datos),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al actualizar plato');
  }
  return res.json();
}

export async function obtenerIngredientes(cabeceras = {}) {
  const res = await fetch(`${API_BASE}/admin/ingredientes`, { headers: cabeceras });
  if (!res.ok) throw new Error('Error al obtener ingredientes');
  return res.json();
}
