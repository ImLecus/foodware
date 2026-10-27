import { z } from 'zod';

export const partidaSchema = z.enum(['entrantes', 'principales', 'postres']);

export const crearPlatoSchema = z
  .object({
    nombre: z.string().min(1, 'Nombre obligatorio'),
    partida: partidaSchema.optional(),
    partida_codigo: partidaSchema.optional(),
    precio: z.union([z.number(), z.string()]).optional(),
    precio_centimos: z.union([z.number(), z.string()]).optional(),
    activo: z.boolean().optional(),
    ingredienteIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    const partida = data.partida || data.partida_codigo;
    if (!partida) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Partida inválida' });
      return;
    }
    if (!partidaSchema.safeParse(partida).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Partida inválida' });
      return;
    }
    let p = data.precio_centimos !== undefined ? data.precio_centimos : data.precio;
    if (p === undefined) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Precio inválido' });
      return;
    }
    if (typeof p === 'string') {
      p = Number(String(p).replace(',', '.'));
    }
    if (typeof p !== 'number' || Number.isNaN(p) || p <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El precio debe ser mayor que 0' });
      return;
    }
    if (Array.isArray(data.ingredienteIds)) {
      if (new Set(data.ingredienteIds).size !== data.ingredienteIds.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Datos inválidos' });
        return;
      }
    }
  })
  .transform((data) => {
    const partida_codigo = data.partida || data.partida_codigo;
    let p = data.precio_centimos !== undefined ? data.precio_centimos : data.precio;
    if (typeof p === 'string') p = Number(String(p).replace(',', '.'));
    const precio_centimos = Math.round(p * 100);
    return {
      nombre: data.nombre,
      partida_codigo,
      precio_centimos,
      activo: data.activo,
      ingredienteIds: Array.isArray(data.ingredienteIds) ? [...new Set(data.ingredienteIds)] : [],
    };
  });

export const actualizarPlatoSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    partida: partidaSchema.optional(),
    partida_codigo: partidaSchema.optional(),
    precio: z.union([z.number(), z.string()]).optional(),
    precio_centimos: z.union([z.number(), z.string()]).optional(),
    activo: z.boolean().optional(),
    ingredienteIds: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sin cambios' });
      return;
    }
    if ((data.partida || data.partida_codigo) && !partidaSchema.safeParse(data.partida || data.partida_codigo).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Partida inválida' });
      return;
    }
    const p = data.precio_centimos !== undefined ? data.precio_centimos : data.precio;
    if (p !== undefined) {
      let pn = typeof p === 'string' ? Number(String(p).replace(',', '.')) : p;
      if (typeof pn !== 'number' || Number.isNaN(pn) || pn <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El precio debe ser mayor que 0' });
        return;
      }
    }
    if (Array.isArray(data.ingredienteIds)) {
      if (new Set(data.ingredienteIds).size !== data.ingredienteIds.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Datos inválidos' });
        return;
      }
    }
  })
  .transform((data) => {
    const res = {};
    if (data.nombre !== undefined) res.nombre = data.nombre;
    if (data.partida || data.partida_codigo) res.partida_codigo = data.partida || data.partida_codigo;
    if (data.activo !== undefined) res.activo = data.activo;
    if (data.ingredienteIds !== undefined) res.ingredienteIds = Array.isArray(data.ingredienteIds) ? [...new Set(data.ingredienteIds)] : [];
    const p = data.precio_centimos !== undefined ? data.precio_centimos : data.precio;
    if (p !== undefined) {
      let pn = typeof p === 'string' ? Number(String(p).replace(',', '.')) : p;
      res.precio_centimos = Math.round(pn * 100);
    }
    return res;
  });

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
