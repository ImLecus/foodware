import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { createDb } from '../src/db/index.js';

describe('GET /api/health', () => {
  let db;

  afterEach(() => {
    db?.close();
  });

  it('responde con estado ok y comprueba la base de datos', async () => {
    db = createDb(':memory:');
    const app = createApp(db);

    const respuesta = await request(app).get('/api/health');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ estado: 'ok', servicio: 'foodware-backend' });
  });

  it('aplica las migraciones base en una base de datos vacía', () => {
    db = createDb(':memory:');

    const tablas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
      .all()
      .map((fila) => fila.name);

    expect(tablas).toContain('pedidos');
    expect(tablas).toContain('lineas_pedido');
    expect(tablas).toContain('cuentas_partes');
    expect(tablas).toContain('plato_ingredientes');
  });
});
