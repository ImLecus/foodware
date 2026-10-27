import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { CABECERA_CAMARERO } from '../ayuda.js';

describe('sala en vivo (US1)', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    db = crearBase();
    app = createApp(db);
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', platoId: 'plato-principal' });
  }

  it('marca un plato como listo y se refleja en la instantánea de sala sin recargar', async () => {
    preparar();

    const marcar = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(marcar.status).toBe(200);
    expect(marcar.body.estado).toBe('listo');

    const sala = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);

    expect(sala.status).toBe(200);
    expect(sala.body.mesas).toHaveLength(1);

    const [mesa] = sala.body.mesas;
    const platoListo = mesa.platos.find((plato) => plato.id === 'linea-1');
    const platoPendiente = mesa.platos.find((plato) => plato.id === 'linea-2');

    expect(platoListo.estado).toBe('listo');
    expect(platoPendiente.estado).toBe('pendiente');
    expect(mesa.completa).toBe(false);
  });

  it('al marcar todos los platos como listos la mesa pasa a completa', async () => {
    preparar();

    await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-2/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    const sala = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);

    const [mesa] = sala.body.mesas;
    expect(mesa.completa).toBe(true);
    expect(mesa.platos.every((plato) => plato.estado === 'listo')).toBe(true);
  });
});
