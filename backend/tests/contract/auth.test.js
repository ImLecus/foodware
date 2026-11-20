import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBaseDePrueba } from '../ayuda.js';
import { insertarCredencialesDemo } from '../helpers/auth.js';

function cookieDe(respuesta) {
  const cabecera = respuesta.headers['set-cookie']?.[0];
  return cabecera?.split(';')[0];
}

describe('Contrato de autenticación', () => {
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

  it('POST /api/auth/login inicia sesión con credenciales válidas', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'demo1234' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      id: 'camarero-1',
      nombre: 'Ana (camarera)',
      rol: 'camarero',
      partida: null,
    });
    expect(respuesta.body).not.toHaveProperty('password_hash');
    expect(respuesta.headers['set-cookie'][0]).toContain('foodware_session=');
    expect(respuesta.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(respuesta.headers['set-cookie'][0]).toContain('SameSite=Lax');
  });

  it('GET /api/auth/me devuelve el usuario de la cookie', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'cocinero-entrantes', password: 'demo1234' });

    const respuesta = await request(app).get('/api/auth/me').set('Cookie', cookieDe(login));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      id: 'cocinero-entrantes',
      rol: 'cocinero',
      partida: 'entrantes',
    });
  });

  it('responde 401 sin sesión y con credenciales incorrectas', async () => {
    const sinSesion = await request(app).get('/api/auth/me');
    const incorrecta = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'incorrecta' });
    const desconocido = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'no-existe', password: 'demo1234' });

    expect(sinSesion.status).toBe(401);
    expect(incorrecta.status).toBe(401);
    expect(desconocido.status).toBe(401);
    expect(incorrecta.body.mensaje).toBe('Usuario o contraseña incorrectos');
    expect(desconocido.body.mensaje).toBe('Usuario o contraseña incorrectos');
  });

  it('valida los campos obligatorios', async () => {
    const respuesta = await request(app).post('/api/auth/login').send({ usuario: 'camarero-1' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('datos_invalidos');
  });

  it('POST /api/auth/logout revoca la sesión y borra la cookie', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'camarero-1', password: 'demo1234' });
    const cookie = cookieDe(login);

    const logout = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    const me = await request(app).get('/api/auth/me').set('Cookie', cookie);

    expect(logout.status).toBe(204);
    expect(logout.headers['set-cookie'][0]).toContain('Max-Age=0');
    expect(me.status).toBe(401);
  });
});
