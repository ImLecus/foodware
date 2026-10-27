import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/index.js';
import {
  CABECERA_ADMIN,
  CABECERA_CAMARERO,
  CABECERA_CAMARERO_2,
  CABECERA_COCINERO,
  CABECERA_COCINERO_POSTRES,
  CABECERA_COCINERO_PRINCIPALES,
  CABECERA_COCINERO_SIN_PARTIDA,
  CABECERA_ENCARGADO,
  cookieCocinero,
  insertarSesionesPrueba,
} from './helpers/auth.js';

export {
  CABECERA_ADMIN,
  CABECERA_CAMARERO,
  CABECERA_CAMARERO_2,
  CABECERA_COCINERO,
  CABECERA_COCINERO_POSTRES,
  CABECERA_COCINERO_PRINCIPALES,
  CABECERA_COCINERO_SIN_PARTIDA,
  CABECERA_ENCARGADO,
  cookieCocinero,
};
export const CAMARERO_ID = 'camarero-1';

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

  const insertarUsuario = db.prepare(
    'INSERT INTO usuarios (id, nombre, rol, partida_codigo) VALUES (?, ?, ?, ?)',
  );
  insertarUsuario.run(CAMARERO_ID, 'Ana (camarera)', 'camarero', null);
  insertarUsuario.run('camarero-2', 'Luis (camarero)', 'camarero', null);
  insertarUsuario.run('cocinero-entrantes', 'Marta (entrantes)', 'cocinero', 'entrantes');
  insertarUsuario.run('cocinero-principales', 'Pablo (principales)', 'cocinero', 'principales');
  insertarUsuario.run('cocinero-postres', 'Lucía (postres)', 'cocinero', 'postres');
  insertarUsuario.run('cocinero-sin-partida', 'Sin partida', 'cocinero', null);
  insertarUsuario.run('encargado-1', 'Carmen (encargada)', 'encargado', null);
  insertarUsuario.run('admin-1', 'Administración', 'administrador', null);

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

  insertarSesionesPrueba(db);
  return db;
}

export function crearAppDePrueba() {
  const db = crearBaseDePrueba();
  return { db, app: createApp(db) };
}

/** Cliente SSE falso que acumula lo escrito por el servidor. */
export function clienteSseFalso() {
  const escrito = [];
  const respuesta = {
    writeHead: () => {},
    write: (trozo) => escrito.push(String(trozo)),
    end: () => {},
  };
  const peticion = { on: () => {} };
  return { respuesta, peticion, escrito };
}

/** Crea y confirma un pedido enviado con una línea de cada partida. */
export async function crearPedidoEnviado(app, { mesaId = 'mesa-1' } = {}) {
  const abierto = await request(app).post(`/api/mesas/${mesaId}/abrir`).set(CABECERA_CAMARERO);

  const pedidoId = abierto.body.id;

  for (const plato of ['plato-entrante', 'plato-principal', 'plato-postre']) {
    await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: plato, cantidad: 1 });
  }

  await request(app).post(`/api/pedidos/${pedidoId}/confirmar`).set(CABECERA_CAMARERO);

  return pedidoId;
}
