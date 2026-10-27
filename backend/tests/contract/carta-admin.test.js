import { describe, expect, it } from 'vitest';
import request from 'supertest';
import Database from 'better-sqlite3';
import { createApp } from '../../src/app.js';

function setupDb() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE partidas (codigo TEXT PRIMARY KEY, nombre TEXT NOT NULL, orden INTEGER NOT NULL);
    INSERT INTO partidas VALUES ('entrantes','Entrantes',1),('principales','Principales',2),('postres','Postres',3);
    CREATE TABLE usuarios (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, rol TEXT NOT NULL);
    INSERT INTO usuarios VALUES ('admin-1','Admin','administrador');
    CREATE TABLE platos (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, partida_codigo TEXT NOT NULL, precio_centimos INTEGER NOT NULL, activo INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE ingredientes (id TEXT PRIMARY KEY, nombre TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'disponible');
    CREATE TABLE plato_ingredientes (plato_id TEXT NOT NULL, ingrediente_id TEXT NOT NULL, PRIMARY KEY(plato_id, ingrediente_id));
  `);
  return db;
}

describe('carta-admin contract', () => {
  it('GET/POST/PATCH /api/admin/platos', async () => {
    const db = setupDb();
    const app = createApp(db);
    const list = await request(app).get('/api/admin/platos').set('x-usuario-id', 'admin-1');
    expect(list.status).toBe(200);
    const post = await request(app)
      .post('/api/admin/platos')
      .set('x-usuario-id', 'admin-1')
      .send({ nombre: 'Tapa', partida_codigo: 'entrantes', precio: 2.5 });
    expect(post.status).toBe(201);
    expect(post.body.nombre).toBe('Tapa');
    const patch = await request(app)
      .patch(`/api/admin/platos/${post.body.id}`)
      .set('x-usuario-id', 'admin-1')
      .send({ precio: 3.0 });
    expect(patch.status).toBe(200);
    expect(patch.body.precio_centimos).toBe(300);
  });
});
