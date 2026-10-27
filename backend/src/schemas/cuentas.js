import { z } from 'zod';
import { ErrorHttp } from '../middleware/error.js';

const esquemaCierreUnico = z.object({
  modo: z.literal('unico', {
    errorMap: () => ({ message: 'El modo de cierre no es válido' }),
  }),
  total_base_centimos: z.coerce
    .number()
    .int('El total debe estar en céntimos enteros')
    .min(0, 'El total no puede ser negativo'),
});

function validar(esquema, datos) {
  const resultado = esquema.safeParse(datos);
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((issue) => issue.message).join('. ');
    throw new ErrorHttp(400, detalle || 'Datos inválidos');
  }
  return resultado.data;
}

export function validarCierreUnico(datos) {
  return validar(esquemaCierreUnico, datos);
}
