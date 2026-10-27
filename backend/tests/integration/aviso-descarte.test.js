import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { reiniciarHub } from '../../src/realtime/hub.js';
import {
  CABECERA_CAMARERO,
  crearAppDePrueba,
  crearPedidoEnviado,
} from '../ayuda.js';

describe('descarte y regeneración del aviso de mesa', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  async function leerMesa() {
    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);
    return respuesta.body.mesas[0];
  }

  async function marcarTodasListas(pedidoId) {
    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
    const lineas = Object.entries(pedido.body.por_partida ?? {}).flatMap(([partida, grupo]) =>
      grupo.map((linea) => ({ ...linea, partida })),
    );
    for (const linea of lineas) {
      await request(app)
        .put(`/api/pedidos/${pedidoId}/lineas/${linea.id}/estado?partida=${linea.partida}`)
        .set(CABECERA_CAMARERO)
        .send({ estado: 'listo' });
    }
    return lineas;
  }

  async function descartar(avisoId) {
    return request(app)
      .post(`/api/sala/avisos/${avisoId}/descartar`)
      .set(CABECERA_CAMARERO);
  }

  it('no vuelve a mostrarse tras recargar la vista (coherencia al reconectar)', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    await marcarTodasListas(pedidoId);

    const completa = await leerMesa();
    expect(completa.aviso).toMatchObject({ estado: 'activo' });

    const descarte = await descartar(completa.aviso.id);
    expect(descarte.status).toBe(200);

    const trasDescarte = await leerMesa();
    expect(trasDescarte.completa).toBe(true);
    expect(trasDescarte.aviso).toBeNull();

    const trasReconectar = await leerMesa();
    expect(trasReconectar.aviso).toBeNull();
  });

  it('genera un aviso nuevo al marcarse un plato listo tras una edición', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    await marcarTodasListas(pedidoId);

    const completa = await leerMesa();
    const avisoOriginal = completa.aviso.id;
    await descartar(avisoOriginal);

    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    const nueva = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante-2', cantidad: 1 });

    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);
    expect(envio.status).toBe(200);

    const incompleta = await leerMesa();
    expect(incompleta.completa).toBe(false);
    expect(incompleta.aviso).toBeNull();

    const marca = await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${nueva.body.id}/estado?partida=entrantes`)
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(marca.status).toBe(200);
    expect(marca.body.mesa).toMatchObject({ completa: true });
    expect(marca.body.mesa.aviso).toMatchObject({ estado: 'activo' });
    expect(marca.body.mesa.aviso.id).not.toBe(avisoOriginal);

    const reCompleta = await leerMesa();
    expect(reCompleta.aviso.id).toBe(marca.body.mesa.aviso.id);
  });

  it('deja de mostrar la mesa y su aviso al cerrarse la cuenta', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    await marcarTodasListas(pedidoId);

    const completa = await leerMesa();
    expect(completa.aviso).toMatchObject({ estado: 'activo' });

    db.prepare("UPDATE mesas SET estado = 'cerrada' WHERE id = 'mesa-1'").run();

    const sala = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);
    expect(sala.body.mesas).toEqual([]);
  });
});
