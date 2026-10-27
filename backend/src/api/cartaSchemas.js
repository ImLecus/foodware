import { z } from 'zod';

export const partidaSchema = z.enum(['entrantes', 'principales', 'postres']);

export const precioSchema = z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (typeof v === 'string') {
      const n = Number(v.replace(',', '.'));
      return n;
    }
    return v;
  })
  .refine((n) => typeof n === 'number' && !Number.isNaN(n), { message: 'Precio inválido' })
  .refine((n) => n > 0, { message: 'El precio debe ser mayor que 0' })
  .transform((n) => Math.round(n * 100));

export const crearPlatoSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  partida_codigo: partidaSchema,
  precio_centimos: precioSchema.optional(),
  precio: precioSchema.optional(),
  activo: z.boolean().optional(),
  ingredienteIds: z.array(z.string()).optional(),
});

export const actualizarPlatoSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    partida_codigo: partidaSchema.optional(),
    precio_centimos: precioSchema.optional(),
    precio: precioSchema.optional(),
    activo: z.boolean().optional(),
    ingredienteIds: z.array(z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Sin cambios' });

export const crearIngredienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  estado: z.enum(['disponible', 'agotado']).optional(),
});

export const actualizarIngredienteSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    estado: z.enum(['disponible', 'agotado']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Sin cambios' });
