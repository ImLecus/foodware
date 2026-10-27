import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { config } from '../../src/config.js';
import { CABECERA_CAMARERO, crearBaseDePrueba } from '../ayuda.js';
import { insertarCredencialesDemo } from '../helpers/auth.js';

describe('Seguridad de autenticación', () => {
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

  it('usa cookies HttpOnly, SameSite=Lax y sin Secure en desarrollo', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'demo1234' });
    const cookie = respuesta.headers['set-cookie'][0];

    expect(cookie).toContain(`${config.sessionCookieName}=`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    if (config.sessionCookieSecure) {
      expect(cookie).toContain('Secure');
    } else {
      expect(cookie).not.toContain('Secure');
    }
  });

  it('no devuelve hashes, tokens ni contraseñas en las respuestas', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'demo1234' });
    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', login.headers['set-cookie'][0].split(';')[0]);

    for (const respuesta of [login, me]) {
      const cuerpo = JSON.stringify(respuesta.body);
      expect(cuerpo).not.toContain('demo1234');
      expect(cuerpo).not.toContain('password_hash');
      expect(cuerpo).not.toContain('scrypt$');
      expect(cuerpo).not.toContain('foodware_session');
    }
  });

  it('responde al preflight CORS con credenciales', async () => {
    const respuesta = await request(app)
      .options('/api/auth/login')
      .set('Origin', config.corsOrigin)
      .set('Access-Control-Request-Method', 'POST');

    expect(respuesta.headers['access-control-allow-origin']).toBe(config.corsOrigin);
    expect(respuesta.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rechaza una escritura desde un origen no permitido sin ejecutarla', async () => {
    const pedidosAntes = db.prepare('SELECT COUNT(*) AS total FROM pedidos').get().total;

    const respuesta = await request(app)
      .post('/api/mesas/mesa-1/abrir')
      .set(CABECERA_CAMARERO)
      .set('Origin', 'http://origen-no-permitido.example');

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toMatchObject({
      codigo: 'origen_no_permitido',
      mensaje: 'Origen no permitido',
    });
    expect(db.prepare('SELECT COUNT(*) AS total FROM pedidos').get().total).toBe(pedidosAntes);
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('libre');
  });

  it('rechaza el preflight de un origen no permitido', async () => {
    const respuesta = await request(app)
      .options('/api/mesas/mesa-1/abrir')
      .set('Origin', 'http://origen-no-permitido.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(respuesta.status).toBe(403);
    expect(respuesta.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('permite una escritura desde el origen configurado', async () => {
    const respuesta = await request(app)
      .post('/api/mesas/mesa-1/abrir')
      .set(CABECERA_CAMARERO)
      .set('Origin', config.corsOrigin);

    expect(respuesta.status).toBe(201);
    expect(respuesta.headers['access-control-allow-origin']).toBe(config.corsOrigin);
  });

  it('no revela si el usuario existe en el error de login', async () => {
    const usuarioInexistente = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'no-existe', password: 'demo1234' });
    const passwordIncorrecta = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'incorrecta' });

    expect(usuarioInexistente.status).toBe(401);
    expect(passwordIncorrecta.status).toBe(401);
    expect(usuarioInexistente.body).toEqual(passwordIncorrecta.body);
  });
});
