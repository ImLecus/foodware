import express from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { requireRole } from '../middleware/authorize.js';
import { actualizarIngredienteSchema, crearIngredienteSchema } from './cartaSchemas.js';
import { CartaService } from '../services/cartaService.js';

export function crearCartaIngredientesRouter(db) {
  const router = express.Router();
  const cartaService = new CartaService(db);
  router.use(autenticar(db), requireRole('administrador'));

  router.get('/', (req, res) => {
    try {
      const ingredientes = cartaService.listarIngredientes ? cartaService.listarIngredientes() : db.prepare('SELECT * FROM ingredientes ORDER BY nombre').all();
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
      const ing = cartaService.crearIngrediente
        ? cartaService.crearIngrediente({ nombre: parsed.data.nombre, estado: parsed.data.estado || 'disponible' })
        : (() => {
            const { randomUUID } = require('crypto');
            const id = randomUUID();
            db.prepare('INSERT INTO ingredientes (id, nombre, estado) VALUES (?, ?, ?)').run(id, parsed.data.nombre, parsed.data.estado || 'disponible');
            return db.prepare('SELECT * FROM ingredientes WHERE id = ?').get(id);
          })();
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
      if (datos.nombre !== undefined && typeof datos.nombre === 'string' && datos.nombre.trim() === '') {
        return res.status(400).json({ error: 'Nombre obligatorio' });
      }
      if (datos.estado !== undefined && datos.estado !== 'disponible' && datos.estado !== 'agotado') {
        return res.status(400).json({ error: 'Datos inválidos' });
      }
      const existe = cartaService.obtenerIngrediente ? cartaService.obtenerIngrediente(req.params.id) : db.prepare('SELECT * FROM ingredientes WHERE id = ?').get(req.params.id);
      if (!existe) return res.status(404).json({ error: 'No encontrado' });
      const ing = cartaService.actualizarIngrediente
        ? cartaService.actualizarIngrediente(req.params.id, datos)
        : (() => {
            const campos = [];
            const valores = [];
            if (datos.nombre !== undefined) { campos.push('nombre = ?'); valores.push(datos.nombre); }
            if (datos.estado !== undefined) { campos.push('estado = ?'); valores.push(datos.estado); }
            if (campos.length === 0) return existe;
            valores.push(req.params.id);
            db.prepare(`UPDATE ingredientes SET ${campos.join(', ')} WHERE id = ?`).run(...valores);
            return db.prepare('SELECT * FROM ingredientes WHERE id = ?').get(req.params.id);
          })();
      res.json(ing);
    } catch (e) {
      res.status(400).json({ error: 'Datos inválidos' });
    }
  });

  return router;
}
