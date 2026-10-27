import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import { listarPedidosPendientes } from '../../src/services/verPedidos.js';
import { CABECERA_CAMARERO, clienteSseFalso, crearAppDePrueba } from '../ayuda.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('lista de cocina en vivo', () => {
  let db;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  it('inserta un pedido nuevo en la posición que le corresponde por antigüedad', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-a', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'la', pedidoId: 'pedido-a' });
    insertarPedido(db, { id: 'pedido-c', enviadoEn: '2026-10-20 11:00:00' });
    insertarLinea(db, { id: 'lc', pedidoId: 'pedido-c' });

    insertarPedido(db, { id: 'pedido-b', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'lb', pedidoId: 'pedido-b' });

    const ids = listarPedidosPendientes(db, 'entrantes').map((pedido) => pedido.id);

    expect(ids).toEqual(['pedido-a', 'pedido-b', 'pedido-c']);
  });

  it('retira de la lista un pedido cuando todas sus líneas dejan de estar pendientes', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-a', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'la', pedidoId: 'pedido-a' });
    insertarPedido(db, { id: 'pedido-b', enviadoEn: '2026-10-20 10:00:00' });
    insertarLinea(db, { id: 'lb', pedidoId: 'pedido-b' });

    db.prepare(
      "UPDATE lineas_pedido SET estado = 'listo', listo_en = datetime('now') WHERE pedido_id = ?",
    ).run('pedido-a');

    const ids = listarPedidosPendientes(db, 'entrantes').map((pedido) => pedido.id);

    expect(ids).toEqual(['pedido-b']);
  });

  it('emite pedido.nuevo al confirmar y pendientes-cambiado al completar por SSE', async () => {
    const prueba = crearAppDePrueba();
    db = prueba.db;
    const { app } = prueba;

    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    const pedidoId = abierto.body.id;
    const linea = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante', cantidad: 1 });

    const entrantes = clienteSseFalso();
    suscribir(entrantes.peticion, entrantes.respuesta, 'entrantes');

    await request(app).post(`/api/pedidos/${pedidoId}/confirmar`).set(CABECERA_CAMARERO);

    expect(entrantes.escrito.join('')).toContain('event: pedido.nuevo');

    const marcado = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${linea.body.id}/estado?partida=entrantes`)
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(marcado.status).toBe(200);
    expect(entrantes.escrito.join('')).toContain('event: pedido.pendientes-cambiado');

    const pendientes = await request(app).get('/api/partidas/entrantes/pedidos-pendientes');
    expect(pendientes.body).toEqual([]);
  });
});
