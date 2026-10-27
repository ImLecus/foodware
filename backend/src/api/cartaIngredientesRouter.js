import express from 'express';
import { randomUUID } from 'crypto';
import { requireRole } from '../middleware/authorize.js';
import { actualizarIngredienteSchema, crearIngredienteSchema } from './cartaSchemas.js';

export function crearCartaIngredientesRouter(db) {
  const router = express.Router();
  router.use(requireRole('administrador'));

  router.get('/', (req, res) => {
    try {
      const ingredientes = db.prepare('SELECT * FROM ingredientes ORDER BY nombre').all();
      res.json(ingredientes);
    } catch (e) {
      res.status(500).json({ error: 'Error interno' });
    }
  });

  router.post('/', (req, res) => {
    try {
      const parsed = crearIngredienteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' });
      }
      const id = randomUUID();
      db.prepare('INSERT INTO ingredientes (id, nombre, estado) VALUES (?, ?, ?)').run(
        id,
        parsed.data.nombre,
        parsed.data.estado || 'disponible',
      );
      const ing = db.prepare('SELECT * FROM ingredientes WHERE id = ?').get(id);
      res.status(201).json(ing);
    } catch (e) {
      res.status(400).json({ error: 'Datos inválidos' });
    }
  });

  router.patch('/:id', (req, res) => {
    try {
      const parsed = actualizarIngredienteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' });
      }
      const datos = parsed.data;
      const campos = [];
      const valores = [];
      if (datos.nombre !== undefined) {
        campos.push('nombre = ?');
        valores.push(datos.nombre);
      }
      if (datos.estado !== undefined) {
        campos.push('estado = ?');
        valores.push(datos.estado);
      }
      if (campos.length === 0) return res.status(400).json({ error: 'Sin cambios' });
      valores.push(req.params.id);
      db.prepare(`UPDATE ingredientes SET ${campos.join(', ')} WHERE id = ?`).run(...valores);
      const ing = db.prepare('SELECT * FROM ingredientes WHERE id = ?').get(req.params.id);
      if (!ing) return res.status(404).json({ error: 'No encontrado' });
      res.json(ing);
    } catch (e) {
      res.status(400).json({ error: 'Datos inválidos' });
    }
  });

  return router;
}
