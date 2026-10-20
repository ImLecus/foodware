import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(HERE, '../../migrations');

function aplicarMigraciones(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migraciones (
      nombre TEXT PRIMARY KEY,
      aplicada_en TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  const aplicadas = new Set(
    db
      .prepare('SELECT nombre FROM _migraciones')
      .all()
      .map((fila) => fila.nombre),
  );

  const ficheros = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((nombre) => nombre.endsWith('.sql'))
    .sort();

  for (const nombre of ficheros) {
    if (aplicadas.has(nombre)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, nombre), 'utf8');
    const ejecutar = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO _migraciones (nombre) VALUES (?)').run(nombre);
    });
    ejecutar();
  }
}

/**
 * Crea la conexión a SQLite y aplica las migraciones pendientes.
 * Usa ':memory:' en pruebas para una base de datos aislada.
 */
export function createDb(ruta = process.env.DB_PATH ?? './data/foodware.db') {
  if (ruta !== ':memory:') {
    fs.mkdirSync(path.dirname(ruta), { recursive: true });
  }

  const db = new Database(ruta);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  aplicarMigraciones(db);
  return db;
}
