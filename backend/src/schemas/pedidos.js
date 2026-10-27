import { z } from 'zod';
import { ErrorHttp } from '../middleware/error.js';

const esquemaNuevaLinea = z.object({
  plato_id: z.string().min(1, 'El plato es obligatorio'),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').default(1),
});

const esquemaLineaPatch = z.object({
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
});

function validar(esquema, datos) {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((issue) => issue.message).join('. ');
    throw new ErrorHttp(400, detalle || 'Datos inválidos');
  }
  return resultado.data;
}

export function validarNuevaLinea(datos) {
  return validar(esquemaNuevaLinea, datos);
}

export function validarLineaPatch(datos) {
  return validar(esquemaLineaPatch, datos);
}
