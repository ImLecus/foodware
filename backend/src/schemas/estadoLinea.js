import { z } from 'zod';

export const esquemaCambioEstadoLinea = z.object({
  estado: z.enum(['pendiente', 'listo']),
});
