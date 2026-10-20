import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba } from './ayuda.js';

describe('Pedidos · líneas', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function abrirPedido() {
    ({ db, app } = crearAppDePrueba());
    const respuesta = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    return respuesta.body.id;
  }

  function anadir(pedidoId, cuerpo) {
    return request(app).post(`/api/pedidos/${pedidoId}/lineas`).set(CABECERA_CAMARERO).send(cuerpo);
  }

  it('añade un plato con cantidad y su partida, fijando el precio del momento', async () => {
    const pedidoId = await abrirPedido();

    const respuesta = await anadir(pedidoId, { plato_id: 'plato-entrante', cantidad: 2 });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      plato_id: 'plato-entrante',
      plato_nombre: 'Croquetas de jamón',
      cantidad: 2,
      precio_centimos: 850,
      partida: 'entrantes',
    });
  });

  it('permite repetir el mismo plato en líneas distintas', async () => {
    const pedidoId = await abrirPedido();

    await anadir(pedidoId, { plato_id: 'plato-entrante', cantidad: 1 });
    await anadir(pedidoId, { plato_id: 'plato-entrante', cantidad: 3 });

    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);

    expect(pedido.body.lineas).toHaveLength(2);
    expect(pedido.body.por_partida.entrantes).toHaveLength(2);
  });

  it('modifica la cantidad de una línea y retira otra', async () => {
    const pedidoId = await abrirPedido();
    const primera = await anadir(pedidoId, { plato_id: 'plato-entrante', cantidad: 1 });
    const segunda = await anadir(pedidoId, { plato_id: 'plato-principal', cantidad: 1 });

    const modificada = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${primera.body.id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 5 });
    expect(modificada.status).toBe(200);
    expect(modificada.body.cantidad).toBe(5);

    const retirada = await request(app)
      .delete(`/api/pedidos/${pedidoId}/lineas/${segunda.body.id}`)
      .set(CABECERA_CAMARERO);
    expect(retirada.status).toBe(204);

    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
    expect(pedido.body.lineas).toHaveLength(1);
    expect(pedido.body.lineas[0].cantidad).toBe(5);
  });

  it('mantiene el precio fijado aunque cambie el precio de la carta', async () => {
    const pedidoId = await abrirPedido();
    await anadir(pedidoId, { plato_id: 'plato-entrante', cantidad: 1 });

    db.prepare("UPDATE platos SET precio_centimos = 999 WHERE id = 'plato-entrante'").run();

    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);

    expect(pedido.body.lineas[0].precio_centimos).toBe(850);
  });

  it('rechaza cantidades menores que 1', async () => {
    const pedidoId = await abrirPedido();

    const respuesta = await anadir(pedidoId, { plato_id: 'plato-entrante', cantidad: 0 });

    expect(respuesta.status).toBe(400);
  });

  it('rechaza platos que no están en la carta disponible', async () => {
    const pedidoId = await abrirPedido();

    const respuesta = await anadir(pedidoId, { plato_id: 'plato-inexistente', cantidad: 1 });

    expect(respuesta.status).toBe(400);
  });

  it('no permite añadir ni modificar líneas de un pedido ya enviado', async () => {
    const pedidoId = await abrirPedido();
    const linea = await anadir(pedidoId, { plato_id: 'plato-entrante', cantidad: 1 });

    await request(app).post(`/api/pedidos/${pedidoId}/confirmar`).set(CABECERA_CAMARERO);

    const nueva = await anadir(pedidoId, { plato_id: 'plato-postre', cantidad: 1 });
    expect(nueva.status).toBe(409);

    const modificada = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${linea.body.id}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 4 });
    expect(modificada.status).toBe(409);
  });
});
