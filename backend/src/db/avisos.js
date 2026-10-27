import { randomUUID } from 'node:crypto';

const CAMPOS = 'id, mesa_id, estado, generado_en, descartado_en';

/** Último aviso de la mesa (activo o descartado), o `null` si nunca hubo. */
export function obtenerAvisoVigente(db, mesaId) {
  return (
    db
      .prepare(`SELECT ${CAMPOS} FROM avisos WHERE mesa_id = ? ORDER BY rowid DESC LIMIT 1`)
      .get(mesaId) ?? null
  );
}

export function obtenerAviso(db, avisoId) {
  return db.prepare(`SELECT ${CAMPOS} FROM avisos WHERE id = ?`).get(avisoId) ?? null;
}

export function crearAviso(db, mesaId) {
  const id = `aviso-${randomUUID()}`;
  db.prepare("INSERT INTO avisos (id, mesa_id, estado) VALUES (?, ?, 'activo')").run(id, mesaId);
  return obtenerAviso(db, id);
}

/**
 * Retira el aviso de una mesa que deja de estar completa. El esquema compartido
 * solo distingue `activo`/`descartado`, así que la retirada elimina la fila.
 */
export function retirarAviso(db, avisoId) {
  db.prepare('DELETE FROM avisos WHERE id = ?').run(avisoId);
}
