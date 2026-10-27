import express from 'express';
import { requireRole } from '../middleware/authorize.js';
import { actualizarPlatoSchema, crearPlatoSchema } from './cartaSchemas.js';

export function crearCartaAdminRouter(db, cartaService) {
  const router = express.Router();
  router.use(requireRole('administrador'));

  router.get('/', (req, res) => {
    try {
      const platos = cartaService.listarPlatosAdmin ? cartaService.listarPlatosAdmin() : cartaService.obtenerCartaVigente();
      res.json(platos);
    } catch (e) {
      res.status(500).json({ error: 'Error interno' });
    }
  });

  router.post('/', (req, res) => {
    try {
      const parsed = crearPlatoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' });
      }
      const datos = parsed.data;
      const precio_centimos = datos.precio_centimos ?? datos.precio;
      if (!precio_centimos) {
        return res.status(400).json({ error: 'Precio inválido' });
      }
      const plato = cartaService.crearPlato({
        nombre: datos.nombre,
        partida_codigo: datos.partida_codigo,
        precio_centimos,
        activo: datos.activo !== undefined ? datos.activo : 1,
        ingredienteIds: datos.ingredienteIds || [],
      });
      res.status(201).json(plato);
    } catch (e) {
      res.status(400).json({ error: 'Datos inválidos' });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const parsed = actualizarPlatoSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' });
      }
      const datos = parsed.data;
      const precio_centimos = datos.precio_centimos ?? datos.precio;
      if (precio_centimos !== undefined && precio_centimos <= 0) {
        return res.status(400).json({ error: 'El precio debe ser mayor que 0' });
      }
      const plato = cartaService.actualizarPlato(req.params.id, {
        nombre: datos.nombre,
        partida_codigo: datos.partida_codigo,
        precio_centimos,
        activo: datos.activo,
        ingredienteIds: datos.ingredienteIds,
      });
      if (!plato) return res.status(404).json({ error: 'No encontrado' });
      res.json(plato);
    } catch (e) {
      res.status(400).json({ error: 'Datos inválidos' });
    }
  });

  return router;
}
