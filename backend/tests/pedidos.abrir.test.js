import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba } from './ayuda.js';

describe('Pedidos · abrir mesa', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    ({ db, app } = crearAppDePrueba());
  }

  it('lista las mesas con su estado y marca las que no tienen pedido en curso', async () => {
    preparar();

    const respuesta = await request(app).get('/api/mesas').set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(2);
    expect(respuesta.body[0]).toMatchObject({
      identificador: 'Mesa 1',
      estado: 'libre',
      pedido_en_curso_id: null,
    });
  });

  it('abre una mesa: la marca ocupada e inicia un pedido en curso', async () => {
    preparar();

    const respuesta = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      mesa_id: 'mesa-1',
      camarero_id: 'camarero-1',
      estado: 'en_curso',
      lineas: [],
    });

    const mesas = await request(app).get('/api/mesas').set(CABECERA_CAMARERO);
    expect(mesas.body.find((mesa) => mesa.id === 'mesa-1')).toMatchObject({
      estado: 'ocupada',
      pedido_en_curso_id: respuesta.body.id,
    });
  });

  it('impide abrir dos veces la misma mesa mientras hay un pedido en curso', async () => {
    preparar();

    await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    const segunda = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    expect(segunda.status).toBe(409);
    const pedidos = db.prepare('SELECT COUNT(*) AS total FROM pedidos').get();
    expect(pedidos.total).toBe(1);
  });

  it('devuelve 404 si la mesa no existe', async () => {
    preparar();

    const respuesta = await request(app)
      .post('/api/mesas/mesa-inexistente/abrir')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(404);
  });

  it('devuelve 401 si el camarero no está identificado', async () => {
    preparar();

    const respuesta = await request(app).post('/api/mesas/mesa-1/abrir');

    expect(respuesta.status).toBe(401);
  });
});
