import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { reiniciarHub, suscribir } from '../src/realtime/hub.js';
import { CABECERA_CAMARERO, clienteSseFalso, crearAppDePrueba } from './ayuda.js';

describe('Pedidos · confirmar', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  async function pedidoConTresPartidas() {
    ({ db, app } = crearAppDePrueba());

    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    const pedidoId = abierto.body.id;

    for (const [plato, cantidad] of [
      ['plato-entrante', 2],
      ['plato-principal', 1],
      ['plato-postre', 3],
    ]) {
      await request(app)
        .post(`/api/pedidos/${pedidoId}/lineas`)
        .set(CABECERA_CAMARERO)
        .send({ plato_id: plato, cantidad });
    }

    return pedidoId;
  }

  function confirmar(pedidoId) {
    return request(app).post(`/api/pedidos/${pedidoId}/confirmar`).set(CABECERA_CAMARERO);
  }

  it('confirma el pedido, lo deja enviado y lo devuelve agrupado por partidas', async () => {
    const pedidoId = await pedidoConTresPartidas();

    const respuesta = await confirmar(pedidoId);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.pedido_id).toBe(pedidoId);
    expect(respuesta.body.mesa).toMatchObject({ id: 'mesa-1', identificador: 'Mesa 1' });
    expect(respuesta.body.confirmada_en).toBeTruthy();
    expect(respuesta.body.por_partida.entrantes).toHaveLength(1);
    expect(respuesta.body.por_partida.principales).toHaveLength(1);
    expect(respuesta.body.por_partida.postres).toHaveLength(1);
    expect(respuesta.body.por_partida.principales[0].cantidad).toBe(1);

    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
    expect(pedido.body.estado).toBe('enviada');
    expect(pedido.body.confirmada_en).toBeTruthy();
    expect(pedido.body.lineas).toHaveLength(3);
  });

  it('publica el evento SSE pedido-confirmado', async () => {
    const pedidoId = await pedidoConTresPartidas();
    const { respuesta, peticion, escrito } = clienteSseFalso();
    suscribir(peticion, respuesta);

    await confirmar(pedidoId);

    const contenido = escrito.join('');
    expect(contenido).toContain('event: pedido-confirmado');
    expect(contenido).toContain(pedidoId);
  });

  it('impide confirmar un pedido vacío', async () => {
    ({ db, app } = crearAppDePrueba());
    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    const respuesta = await confirmar(abierto.body.id);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/vacío/i);
  });

  it('impide confirmar dos veces el mismo pedido', async () => {
    const pedidoId = await pedidoConTresPartidas();
    await confirmar(pedidoId);

    const segunda = await confirmar(pedidoId);

    expect(segunda.status).toBe(409);
  });
});
