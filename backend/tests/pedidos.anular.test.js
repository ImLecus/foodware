import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { reiniciarHub, suscribir } from '../src/realtime/hub.js';
import { CABECERA_CAMARERO, clienteSseFalso, crearAppDePrueba } from './ayuda.js';

describe('Pedidos · anulación', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  it('borra el pedido y sus líneas, libera la mesa y no avisa a cocina', async () => {
    ({ db, app } = crearAppDePrueba());

    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    const pedidoId = abierto.body.id;

    await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante', cantidad: 2 });
    await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-postre', cantidad: 1 });

    const { respuesta, peticion, escrito } = clienteSseFalso();
    suscribir(peticion, respuesta);

    const anulacion = await request(app)
      .post(`/api/pedidos/${pedidoId}/anular`)
      .set(CABECERA_CAMARERO);

    expect(anulacion.status).toBe(204);

    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
    expect(pedido.status).toBe(404);

    const mesas = await request(app).get('/api/mesas').set(CABECERA_CAMARERO);
    expect(mesas.body.find((mesa) => mesa.id === 'mesa-1')).toMatchObject({
      estado: 'libre',
      pedido_en_curso_id: null,
    });

    const lineas = db.prepare('SELECT COUNT(*) AS total FROM lineas_pedido').get();
    expect(lineas.total).toBe(0);

    const contenido = escrito.join('');
    expect(contenido).toContain('event: pedido-anulado');
    expect(contenido).not.toContain('event: pedido-confirmado');
  });

  it('permite abrir de nuevo la mesa tras la anulación', async () => {
    ({ db, app } = crearAppDePrueba());

    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    await request(app).post(`/api/pedidos/${abierto.body.id}/anular`).set(CABECERA_CAMARERO);

    const reabierta = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    expect(reabierta.status).toBe(201);
    expect(reabierta.body.estado).toBe('en_curso');
  });
});
