import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBaseDePrueba } from '../ayuda.js';
import { hashToken, insertarCredencialesDemo } from '../helpers/auth.js';

function cookieDe(respuesta) {
  return respuesta.headers['set-cookie'][0].split(';')[0];
}

describe('Persistencia y cierre de sesión', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBaseDePrueba();
    insertarCredencialesDemo(db);
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('mantiene la sesión entre peticiones y permite varias sesiones del mismo usuario', async () => {
    const primera = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'demo1234' });
    const segunda = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'demo1234' });
    const cookie1 = cookieDe(primera);
    const cookie2 = cookieDe(segunda);

    expect(cookie1).not.toBe(cookie2);
    expect((await request(app).get('/api/mesas').set('Cookie', cookie1)).status).toBe(200);
    expect((await request(app).get('/api/mesas').set('Cookie', cookie2)).status).toBe(200);

    await request(app).post('/api/auth/logout').set('Cookie', cookie1);
    expect((await request(app).get('/api/mesas').set('Cookie', cookie1)).status).toBe(401);
    expect((await request(app).get('/api/mesas').set('Cookie', cookie2)).status).toBe(200);
  });

  it('renueva la ventana de inactividad al usar la sesión', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'demo1234' });
    const cookie = cookieDe(login);
    const token = cookie.split('=')[1];
    const tokenHash = hashToken(decodeURIComponent(token));
    db.prepare(
      "UPDATE sesiones SET expira_en = datetime('now', '+1 minute') WHERE token_hash = ?",
    ).run(tokenHash);
    const antes = db
      .prepare('SELECT expira_en FROM sesiones WHERE token_hash = ?')
      .get(tokenHash).expira_en;

    await request(app).get('/api/auth/me').set('Cookie', cookie);
    const despues = db
      .prepare('SELECT expira_en FROM sesiones WHERE token_hash = ?')
      .get(tokenHash).expira_en;

    expect(despues > antes).toBe(true);
  });
});
