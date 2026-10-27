import { randomUUID } from 'crypto';

export class CartaService {
  constructor(db) {
    this.db = db;
  }

  calcularDisponibilidad(platoId) {
    const plato = this.db.prepare('SELECT * FROM platos WHERE id = ?').get(platoId);
    if (!plato) return { ofrecible: false, motivo: 'no_existe' };
    if (plato.activo !== 1) return { ofrecible: false, motivo: 'inactivo' };
    const ingredientes = this.db
      .prepare(
        `SELECT i.id, i.estado 
         FROM plato_ingredientes pi 
         JOIN ingredientes i ON i.id = pi.ingrediente_id 
         WHERE pi.plato_id = ?`,
      )
      .all(platoId);
    for (const ing of ingredientes) {
      if (ing.estado === 'agotado') {
        return { ofrecible: false, motivo: 'ingrediente_agotado' };
      }
    }
    return { ofrecible: true, motivo: 'activo' };
  }

  obtenerCartaVigente() {
    const platos = this.db.prepare('SELECT * FROM platos ORDER BY partida_codigo, nombre').all();
    return platos.map((plato) => {
      const disp = this.calcularDisponibilidad(plato.id);
      return { ...plato, ofrecible: disp.ofrecible, motivo: disp.motivo };
    });
  }

  obtenerCartaAgrupada() {
    const platos = this.db.prepare('SELECT * FROM platos ORDER BY partida_codigo, nombre').all();
    const resultado = {
      entrantes: [],
      principales: [],
      postres: [],
    };
    for (const plato of platos) {
      const disp = this.calcularDisponibilidad(plato.id);
      if (!disp.ofrecible) continue;
      const partida = plato.partida_codigo || plato.partida;
      if (!resultado[partida]) continue;
      resultado[partida].push({
        id: plato.id,
        nombre: plato.nombre,
        precio: Number((plato.precio_centimos || 0) / 100),
      });
    }
    return resultado;
  }

  crearPlato({ nombre, partida_codigo, precio_centimos, activo = 1, ingredienteIds = [] }) {
    const id = randomUUID();
    this.db
      .prepare('INSERT INTO platos (id, nombre, partida_codigo, precio_centimos, activo) VALUES (?, ?, ?, ?, ?)')
      .run(id, nombre, partida_codigo, precio_centimos, activo ? 1 : 0);
    if (Array.isArray(ingredienteIds) && ingredienteIds.length > 0) {
      const stmt = this.db.prepare('INSERT INTO plato_ingredientes (plato_id, ingrediente_id) VALUES (?, ?)');
      for (const iid of ingredienteIds) {
        const ing = this.db.prepare('SELECT id FROM ingredientes WHERE id = ?').get(iid);
        if (ing) stmt.run(id, iid);
      }
    }
    return this.db.prepare('SELECT * FROM platos WHERE id = ?').get(id);
  }

  actualizarPlato(id, datos) {
    const campos = [];
    const valores = [];
    if (datos.nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(datos.nombre);
    }
    if (datos.partida_codigo !== undefined) {
      campos.push('partida_codigo = ?');
      valores.push(datos.partida_codigo);
    }
    if (datos.precio_centimos !== undefined) {
      campos.push('precio_centimos = ?');
      valores.push(datos.precio_centimos);
    }
    if (datos.activo !== undefined) {
      campos.push('activo = ?');
      valores.push(datos.activo ? 1 : 0);
    }
    if (campos.length > 0) {
      valores.push(id);
      this.db.prepare(`UPDATE platos SET ${campos.join(', ')} WHERE id = ?`).run(...valores);
    }
    if (datos.ingredienteIds !== undefined) {
      const tx = this.db.transaction((ids) => {
        this.db.prepare('DELETE FROM plato_ingredientes WHERE plato_id = ?').run(id);
        if (!Array.isArray(ids) || ids.length === 0) return;
        const stmt = this.db.prepare('INSERT INTO plato_ingredientes (plato_id, ingrediente_id) VALUES (?, ?)');
        for (const iid of ids) {
          const ing = this.db.prepare('SELECT id FROM ingredientes WHERE id = ?').get(iid);
          if (ing) stmt.run(id, iid);
        }
      });
      tx(datos.ingredienteIds);
    }
    return this.db.prepare('SELECT * FROM platos WHERE id = ?').get(id);
  }

  cambiarActivo(id, activo) {
    this.db.prepare('UPDATE platos SET activo = ? WHERE id = ?').run(activo ? 1 : 0, id);
    return this.db.prepare('SELECT * FROM platos WHERE id = ?').get(id);
  }

  listarPlatosAdmin() {
    const platos = this.db.prepare('SELECT * FROM platos ORDER BY partida_codigo, nombre').all();
    return platos.map((plato) => {
      const ingredientes = this.db
        .prepare(
          `SELECT i.id, i.nombre, i.estado 
           FROM plato_ingredientes pi 
           JOIN ingredientes i ON i.id = pi.ingrediente_id 
           WHERE pi.plato_id = ?`,
        )
        .all(plato.id);
      const disp = this.calcularDisponibilidad(plato.id);
      return {
        ...plato,
        ingredientes,
        ofrecible: disp.ofrecible,
        motivo: disp.motivo,
        precio: Number((plato.precio_centimos || 0) / 100),
      };
    });
  }
}
