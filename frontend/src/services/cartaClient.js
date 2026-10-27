import { apiEnviar, apiGet } from './api.js';

export function obtenerCartaAdmin() {
  return apiGet('/admin/platos');
}

export function crearPlato(datos) {
  return apiEnviar('/admin/platos', 'POST', datos);
}

export function actualizarPlato(id, datos) {
  return apiEnviar(`/admin/platos/${encodeURIComponent(id)}`, 'PATCH', datos);
}

export function obtenerIngredientes() {
  return apiGet('/admin/ingredientes');
}

export function crearIngrediente(datos) {
  return apiEnviar('/admin/ingredientes', 'POST', datos);
}

export function actualizarIngrediente(id, datos) {
  return apiEnviar(`/admin/ingredientes/${encodeURIComponent(id)}`, 'PATCH', datos);
}
