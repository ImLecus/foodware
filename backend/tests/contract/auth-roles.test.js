import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  CABECERA_ADMIN,
  CABECERA_CAMARERO,
  CABECERA_COCINERO,
  CABECERA_COCINERO_PRINCIPALES,
  CABECERA_COCINERO_SIN_PARTIDA,
  CABECERA_ENCARGADO,
  crearBaseDePrueba,
} from '../ayuda.js';

describe('Matriz de roles en la API', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBaseDePrueba();
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('responde 401 sin sesión en todas las rutas privadas', async () => {
    expect((await request(app).get('/api/mesas')).status).toBe(401);
    expect((await request(app).get('/api/partidas/entrantes/pedidos-pendientes')).status).toBe(401);
    expect((await request(app).get('/api/sala/mesas')).status).toBe(401);
    expect((await request(app).get('/api/reports/daily')).status).toBe(401);
  });

  it('el camarero accede a sala y cuentas, pero no a cocina ni informes', async () => {
    expect((await request(app).get('/api/mesas').set(CABECERA_CAMARERO)).status).toBe(200);
    expect((await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO)).status).toBe(200);
    expect(
      (await request(app).get('/api/partidas/entrantes/pedidos-pendientes').set(CABECERA_CAMARERO))
        .status,
    ).toBe(403);
    expect((await request(app).get('/api/reports/daily').set(CABECERA_CAMARERO)).status).toBe(403);
  });

  it('el cocinero accede solo a su partida y a su perfil', async () => {
    expect(
      (await request(app).get('/api/partidas/entrantes/pedidos-pendientes').set(CABECERA_COCINERO))
        .status,
    ).toBe(200);
    expect(
      (await request(app).get('/api/cocineros/cocinero-entrantes').set(CABECERA_COCINERO)).status,
    ).toBe(200);
    expect((await request(app).get('/api/mesas').set(CABECERA_COCINERO)).status).toBe(403);
    expect(
      (
        await request(app)
          .get('/api/partidas/principales/pedidos-pendientes')
          .set(CABECERA_COCINERO)
      ).status,
    ).toBe(403);
    expect(
      (await request(app).get('/api/cocineros/cocinero-principales').set(CABECERA_COCINERO)).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get('/api/partidas/entrantes/pedidos-pendientes')
          .set(CABECERA_COCINERO_PRINCIPALES)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .get('/api/partidas/entrantes/pedidos-pendientes')
          .set(CABECERA_COCINERO_SIN_PARTIDA)
      ).status,
    ).toBe(403);
  });

  it('el encargado accede a informes, pero no a sala ni cocina', async () => {
    const informe = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);

    expect(informe.status).not.toBe(401);
    expect(informe.status).not.toBe(403);
    expect((await request(app).get('/api/mesas').set(CABECERA_ENCARGADO)).status).toBe(403);
    expect(
      (await request(app).get('/api/partidas/entrantes/pedidos-pendientes').set(CABECERA_ENCARGADO))
        .status,
    ).toBe(403);
  });

  it('el administrador solo accede a su área y a su propia sesión', async () => {
    expect((await request(app).get('/api/auth/me').set(CABECERA_ADMIN)).status).toBe(200);
    expect((await request(app).get('/api/mesas').set(CABECERA_ADMIN)).status).toBe(403);
    expect(
      (await request(app).get('/api/partidas/entrantes/pedidos-pendientes').set(CABECERA_ADMIN))
        .status,
    ).toBe(403);
    expect((await request(app).get('/api/reports/daily').set(CABECERA_ADMIN)).status).toBe(403);
  });
});
