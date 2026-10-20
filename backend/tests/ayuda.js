import { createApp } from '../src/app.js';
import { createDb } from '../src/db/index.js';

export const CAMARERO_ID = 'camarero-1';
export const CABECERA_CAMARERO = { 'X-Camarero-Id': CAMARERO_ID };

/**
 * Base de datos en memoria con las partidas fijas, dos camareros, dos mesas y
 * cuatro platos (tres partidas) para las pruebas de la historia 001.
 */
export function crearBaseDePrueba() {
  const db = createDb(':memory:');

  const insertarPartida = db.prepare(
    'INSERT INTO partidas (codigo, nombre, orden) VALUES (?, ?, ?)',
  );
  insertarPartida.run('entrantes', 'Entrantes', 1);
  insertarPartida.run('principales', 'Principales', 2);
  insertarPartida.run('postres', 'Postres', 3);

  const insertarUsuario = db.prepare('INSERT INTO usuarios (id, nombre, rol) VALUES (?, ?, ?)');
  insertarUsuario.run(CAMARERO_ID, 'Ana (camarera)', 'camarero');
  insertarUsuario.run('camarero-2', 'Luis (camarero)', 'camarero');

  const insertarMesa = db.prepare('INSERT INTO mesas (id, identificador, estado) VALUES (?, ?, ?)');
  insertarMesa.run('mesa-1', 'Mesa 1', 'libre');
  insertarMesa.run('mesa-2', 'Mesa 2', 'libre');

  const insertarPlato = db.prepare(
    'INSERT INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES (?, ?, ?, ?)',
  );
  insertarPlato.run('plato-entrante', 'Croquetas de jamón', 'entrantes', 850);
  insertarPlato.run('plato-entrante-2', 'Ensalada mixta', 'entrantes', 700);
  insertarPlato.run('plato-principal', 'Paella de marisco', 'principales', 1800);
  insertarPlato.run('plato-postre', 'Tarta de queso', 'postres', 600);

  return db;
}

export function crearAppDePrueba() {
  const db = crearBaseDePrueba();
  return { db, app: createApp(db) };
}
