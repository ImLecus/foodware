import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '..', 'data', 'foodware.db');
const dbDir = dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

function ejecutar(sql) {
  try {
    db.exec(sql);
  } catch (error) {
    console.error('Error al ejecutar SQL:', error.message);
  }
}

function inicializar() {
  ejecutar('PRAGMA foreign_keys = ON;');
  const schemaPath = join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    ejecutar(fs.readFileSync(schemaPath, 'utf8'));
  }
  const migrationsDir = join(__dirname, '..', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const archivos = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const archivo of archivos) {
      const ruta = join(migrationsDir, archivo);
      ejecutar(fs.readFileSync(ruta, 'utf8'));
    }
  }
}

function sembrarPlatosIngredientes() {
  const countIngredientes = db.prepare('SELECT COUNT(*) as c FROM ingredientes').get();
  if (countIngredientes.c > 0) return;
  const insIng = db.prepare('INSERT INTO ingredientes (id, nombre, estado) VALUES (?, ?, ?)');
  const tomate = randomUUID();
  const lechuga = randomUUID();
  const carne = randomUUID();
  insIng.run(tomate, 'Tomate', 'disponible');
  insIng.run(lechuga, 'Lechuga', 'disponible');
  insIng.run(carne, 'Carne', 'disponible');

  const countPlatos = db.prepare('SELECT COUNT(*) as c FROM platos').get();
  if (countPlatos.c === 0) {
    const insPla = db.prepare(
      'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos, activo) VALUES (?, ?, ?, ?, ?)',
    );
    const p1 = randomUUID();
    const p2 = randomUUID();
    insPla.run(p1, 'Ensalada', 'entrantes', 250, 1);
    insPla.run(p2, 'Hamburguesa', 'principales', 850, 1);
    const insRel = db.prepare('INSERT INTO plato_ingredientes (plato_id, ingrediente_id) VALUES (?, ?)');
    insRel.run(p1, tomate);
    insRel.run(p1, lechuga);
    insRel.run(p2, carne);
  }
}

inicializar();
sembrarPlatosIngredientes();
db.close();
console.log('Semilla HU08 aplicada');
