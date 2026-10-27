import { z } from 'zod';

export const partidaSchema = z.enum(['entrantes', 'principales', 'postres']);

export const precioSchema = z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (typeof v === 'string') {
      const n = Number(String(v).replace(',', '.'));
      return n;
    }
    return v;
  })
  .refine((n) => typeof n === 'number' && !Number.isNaN(n), { message: 'Precio inválido' })
  .refine((n) => n > 0, { message: 'El precio debe ser mayor que 0' })
  .transform((n) => Math.round(n * 100));

const platoBase = z.object({
  nombre: z.string().min(1, 'Nombre obligatorio'),
  partida: partidaSchema.optional(),
  partida_codigo: partidaSchema.optional(),
  precio: z.union([z.number(), z.string()]).optional(),
  precio_centimos: z.union([z.number(), z.string()]).optional(),
  activo: z.boolean().optional(),
  ingredienteIds: z.array(z.string()).optional(),
});

export const crearPlatoSchema = platoBase
  .refine((data) => data.partida || data.partida_codigo, { message: 'Partida inválida' })
  .refine((data) => data.precio !== undefined || data.precio_centimos !== undefined, { message: 'Precio inválido' })
  .transform((data) => {
    const partida_codigo = data.partida || data.partida_codigo;
    let precio_centimos;
    if (data.precio_centimos !== undefined) {
      if (typeof data.precio_centimos === 'string') {
        const n = Number(String(data.precio_centimos).replace(',', '.'));
        if (n <= 0) throw new Error('El precio debe ser mayor que 0');
        precio_centimos = Math.round(n * 100);
      } else {
        if (data.precio_centimos <= 0) throw new Error('El precio debe ser mayor que 0');
        precio_centimos = Math.round(data.precio_centimos * 100);
      }
    } else if (data.precio !== undefined) {
      if (typeof data.precio === 'string') {
        const n = Number(String(data.precio).replace(',', '.'));
        if (n <= 0) throw new Error('El precio debe ser mayor que 0');
        precio_centimos = Math.round(n * 100);
      } else {
        if (data.precio <= 0) throw new Error('El precio debe ser mayor que 0');
        precio_centimos = Math.round(data.precio * 100);
      }
    }
    return {
      nombre: data.nombre,
      partida_codigo,
      precio_centimos,
      activo: data.activo,
      ingredienteIds: data.ingredienteIds || [],
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
  .refine((data) => Object.keys(data).length > 0, { message: 'Sin cambios' })
  .transform((data) => {
    const res = {};
    if (data.nombre !== undefined) res.nombre = data.nombre;
    if (data.partida || data.partida_codigo) res.partida_codigo = data.partida || data.partida_codigo;
    if (data.activo !== undefined) res.activo = data.activo;
    if (data.ingredienteIds !== undefined) res.ingredienteIds = data.ingredienteIds;
    if (data.precio_centimos !== undefined) {
      if (typeof data.precio_centimos === 'string') {
        const n = Number(String(data.precio_centimos).replace(',', '.'));
        if (n <= 0) throw new Error('El precio debe ser mayor que 0');
        res.precio_centimos = Math.round(n * 100);
      } else {
        if (data.precio_centimos <= 0) throw new Error('El precio debe ser mayor que 0');
        res.precio_centimos = Math.round(data.precio_centimos * 100);
      }
    } else if (data.precio !== undefined) {
      if (typeof data.precio === 'string') {
        const n = Number(String(data.precio).replace(',', '.'));
        if (n <= 0) throw new Error('El precio debe ser mayor que 0');
        res.precio_centimos = Math.round(n * 100);
      } else {
        if (data.precio <= 0) throw new Error('El precio debe ser mayor que 0');
        res.precio_centimos = Math.round(data.precio * 100);
      }
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
