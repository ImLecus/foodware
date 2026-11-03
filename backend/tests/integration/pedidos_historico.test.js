import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba } from '../ayuda.js';

describe('Pedidos · indicaciones e instantánea histórica', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    ({ db, app } = crearAppDePrueba());
  }

  it('guarda las indicaciones y la instantánea de nombre/partida/precio al pedir', async () => {
    preparar();
    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    const linea = await request(app)
      .post(`/api/pedidos/${abierto.body.id}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante', cantidad: 2, indicaciones: 'sin cebolla' });

    expect(linea.status).toBe(201);
    expect(linea.body).toMatchObject({
      plato_nombre: 'Croquetas de jamón',
      partida: 'entrantes',
      indicaciones: 'sin cebolla',
    });

    const guardada = db
      .prepare(
        `SELECT nombre_plato, partida_codigo, indicaciones
           FROM lineas_pedido WHERE id = ?`,
      )
      .get(linea.body.id);
    expect(guardada).toEqual({
      nombre_plato: 'Croquetas de jamón',
      partida_codigo: 'entrantes',
      indicaciones: 'sin cebolla',
    });
  });

  it('no altera la instantánea si después cambia la carta', async () => {
    preparar();
    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    await request(app)
      .post(`/api/pedidos/${abierto.body.id}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-principal', cantidad: 1 });

    db.prepare(
      `UPDATE platos
          SET nombre = 'Paella del día', partida_codigo = 'postres', precio_centimos = 9999
        WHERE id = 'plato-principal'`,
    ).run();

    const detalle = await request(app)
      .get(`/api/pedidos/${abierto.body.id}`)
      .set(CABECERA_CAMARERO);

    expect(detalle.body.lineas[0]).toMatchObject({
      plato_nombre: 'Paella de marisco',
      partida: 'principales',
      precio_centimos: 1800,
    });
  });
});
