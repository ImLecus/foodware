import express from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { requireRole } from '../middleware/authorize.js';
import { actualizarPlatoSchema, crearPlatoSchema } from './cartaSchemas.js';

export function crearCartaAdminRouter(db, cartaService) {
  const router = express.Router();
  router.use(autenticar(db), requireRole('administrador'));

  router.get('/', (req, res) => {
    try {
      const platos = cartaService.listarPlatosAdmin ? cartaService.listarPlatosAdmin() : cartaService.obtenerCartaVigente ? cartaService.obtenerCartaVigente() : [];
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
      if (Array.isArray(datos.ingredienteIds) && datos.ingredienteIds.length > 0) {
        for (const iid of datos.ingredienteIds) {
          const ing = db.prepare('SELECT id FROM ingredientes WHERE id = ?').get(iid);
          if (!ing) {
            return res.status(400).json({ error: 'Datos inválidos' });
          }
        }
      }
      const plato = cartaService.crearPlato({
        nombre: datos.nombre,
        partida_codigo: datos.partida_codigo,
        precio_centimos: datos.precio_centimos,
        activo: datos.activo !== undefined ? datos.activo : 1,
        ingredienteIds: datos.ingredienteIds || [],
      });
      res.status(201).json(plato);
    } catch (e) {
      if (e.message && e.message.includes('precio')) {
        return res.status(400).json({ error: e.message });
      }
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
      if (datos.precio_centimos !== undefined && datos.precio_centimos <= 0) {
        return res.status(400).json({ error: 'El precio debe ser mayor que 0' });
      }
      if (Array.isArray(datos.ingredienteIds) && datos.ingredienteIds.length > 0) {
        for (const iid of datos.ingredienteIds) {
          const ing = db.prepare('SELECT id FROM ingredientes WHERE id = ?').get(iid);
          if (!ing) {
            return res.status(400).json({ error: 'Datos inválidos' });
          }
        }
      }
      const plato = cartaService.actualizarPlato(req.params.id, datos);
      if (!plato) return res.status(404).json({ error: 'No encontrado' });
      res.json(plato);
    } catch (e) {
      if (e.message && e.message.includes('precio')) {
        return res.status(400).json({ error: e.message });
      }
      res.status(400).json({ error: 'Datos inválidos' });
    }
  });

  return router;
}
