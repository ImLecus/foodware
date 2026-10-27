import { z } from 'zod';
import { ErrorHttp } from '../middleware/error.js';

const esquemaNuevaLinea = z.object({
  plato_id: z.string().min(1, 'El plato es obligatorio'),
  cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').default(1),
  indicaciones: z.string().trim().max(200, 'Las indicaciones son demasiado largas').nullish(),
});

const esquemaLineaPatch = z
  .object({
    cantidad: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1').optional(),
    indicaciones: z.string().trim().max(200, 'Las indicaciones son demasiado largas').nullish(),
  })
  .refine((datos) => datos.cantidad !== undefined || datos.indicaciones !== undefined, {
    message: 'Indica la cantidad o las indicaciones',
  });

function validar(esquema, datos) {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((issue) => issue.message).join('. ');
    throw new ErrorHttp(400, detalle || 'Datos inválidos');
  }
  return resultado.data;
}

export function validarNuevaLineaEdicion(datos) {
  return validar(esquemaNuevaLinea, datos);
}

export function validarLineaPatchEdicion(datos) {
  return validar(esquemaLineaPatch, datos);
}
