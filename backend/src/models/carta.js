import { randomUUID } from 'crypto';

export class PlatoModel {
  constructor(db) {
    this.db = db;
  }

  listar() {
    return this.db.prepare('SELECT * FROM platos').all();
  }

  obtenerPorId(id) {
    return this.db.prepare('SELECT * FROM platos WHERE id = ?').get(id);
  }

  crear({ nombre, partida_codigo, precio_centimos, activo = 1 }) {
    const id = randomUUID();
    this.db
      .prepare('INSERT INTO platos (id, nombre, partida_codigo, precio_centimos, activo) VALUES (?, ?, ?, ?, ?)')
      .run(id, nombre, partida_codigo, precio_centimos, activo ? 1 : 0);
    return this.obtenerPorId(id);
  }

  actualizar(id, datos) {
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
    if (campos.length === 0) return this.obtenerPorId(id);
    valores.push(id);
    this.db.prepare(`UPDATE platos SET ${campos.join(', ')} WHERE id = ?`).run(...valores);
    return this.obtenerPorId(id);
  }
}

export class IngredienteModel {
  constructor(db) {
    this.db = db;
  }

  listar() {
    return this.db.prepare('SELECT * FROM ingredientes').all();
  }

  obtenerPorId(id) {
    return this.db.prepare('SELECT * FROM ingredientes WHERE id = ?').get(id);
  }

  crear({ nombre, estado = 'disponible' }) {
    const id = randomUUID();
    this.db.prepare('INSERT INTO ingredientes (id, nombre, estado) VALUES (?, ?, ?)').run(id, nombre, estado);
    return this.obtenerPorId(id);
  }

  actualizar(id, datos) {
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
    if (campos.length === 0) return this.obtenerPorId(id);
    valores.push(id);
    this.db.prepare(`UPDATE ingredientes SET ${campos.join(', ')} WHERE id = ?`).run(...valores);
    return this.obtenerPorId(id);
  }
}

export class PlatoIngredienteModel {
  constructor(db) {
    this.db = db;
  }

  listarPorPlato(platoId) {
    return this.db
      .prepare('SELECT ingrediente_id FROM plato_ingredientes WHERE plato_id = ?')
      .all(platoId)
      .map((r) => r.ingrediente_id);
  }

  establecer(platoId, ingredienteIds = []) {
    const tx = this.db.transaction((ids) => {
      this.db.prepare('DELETE FROM plato_ingredientes WHERE plato_id = ?').run(platoId);
      const stmt = this.db.prepare('INSERT INTO plato_ingredientes (plato_id, ingrediente_id) VALUES (?, ?)');
      for (const iid of ids) {
        stmt.run(platoId, iid);
      }
    });
    tx(ingredienteIds);
    return this.listarPorPlato(platoId);
  }
}
