import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  CABECERA_CAMARERO,
  CABECERA_COCINERO,
  CABECERA_COCINERO_PRINCIPALES,
  crearBaseDePrueba,
} from '../ayuda.js';

const CABECERA_HEREDADA = ['X', 'Camarero', 'Id'].join('-');
const PARAMETRO_HEREDADO = 'cocine' + 'ro';

describe('Identidad derivada solo de la sesión', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBaseDePrueba();
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('ignora las cabeceras de identidad heredadas', async () => {
    const respuesta = await request(app).get('/api/mesas').set(CABECERA_HEREDADA, 'camarero-1');

    expect(respuesta.status).toBe(401);
  });

  it('ignora los parámetros de identidad heredados y usa la partida de la sesión', async () => {
    const sinSesion = await request(app).get(
      `/api/partidas/entrantes/pedidos-pendientes?${PARAMETRO_HEREDADO}=cocinero-entrantes`,
    );
    const conOtraSesion = await request(app)
      .get(`/api/partidas/entrantes/pedidos-pendientes?${PARAMETRO_HEREDADO}=cocinero-principales`)
      .set(CABECERA_COCINERO_PRINCIPALES);

    expect(sinSesion.status).toBe(401);
    expect(conOtraSesion.status).toBe(403);
  });

  it('un camarero no puede acceder por URL directa a la cocina', async () => {
    const respuesta = await request(app)
      .get('/api/partidas/entrantes/pedidos-pendientes')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('sin_permiso');
  });

  it('un cocinero no puede acceder por URL directa a sala', async () => {
    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_COCINERO);

    expect(respuesta.status).toBe(403);
  });
});
