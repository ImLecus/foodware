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

const esquemaParte = z.object({
  orden: z.coerce.number().int().min(1, 'El orden de la parte debe ser al menos 1'),
  comensal: z.string().trim().min(1, 'Cada parte necesita un comensal').max(80),
  importe_centimos: z.coerce
    .number()
    .int('El importe debe estar en céntimos enteros')
    .min(0, 'El importe no puede ser negativo'),
});

const esquemaAsignacion = z.object({
  parte_orden: z.coerce.number().int().min(1, 'La asignación necesita una parte'),
  linea_id: z.string().min(1, 'La asignación necesita un consumo'),
  importe_centimos: z.coerce
    .number()
    .int('El importe debe estar en céntimos enteros')
    .min(0, 'El importe no puede ser negativo'),
});

const esquemaDivision = z
  .object({
    modo: z.enum(['iguales', 'por_consumo'], {
      errorMap: () => ({ message: 'El modo de división no es válido' }),
    }),
    total_base_centimos: z.coerce
      .number()
      .int('El total debe estar en céntimos enteros')
      .min(0, 'El total no puede ser negativo'),
    partes: z.array(esquemaParte).min(1, 'La división necesita al menos una parte'),
    asignaciones: z.array(esquemaAsignacion).optional().default([]),
  })
  .superRefine((datos, ctx) => {
    const ordenes = new Set();
    for (const parte of datos.partes) {
      if (ordenes.has(parte.orden)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'El orden de las partes debe ser único',
        });
      }
      ordenes.add(parte.orden);
    }
  });

export function validarDivision(datos) {
  return validar(esquemaDivision, datos);
}
