import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import {
  CABECERA_CAMARERO,
  clienteSseFalso,
  crearAppDePrueba,
  crearPedidoEnviado,
} from '../ayuda.js';

describe('recálculo de la mesa completa al editar una comanda enviada', () => {
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
    const lineas = Object.values(pedido.body.por_partida ?? {}).flatMap((partida) => partida);
    for (const linea of lineas) {
      await request(app)
        .put(`/api/pedidos/${pedidoId}/lineas/${linea.id}/estado`)
        .set(CABECERA_CAMARERO)
        .send({ estado: 'listo' });
    }
    return lineas;
  }

  it('añadir un plato pendiente retira el aviso y un nuevo plato listo lo regenera', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);

    const lineas = await marcarTodasListas(pedidoId);
    expect(lineas).toHaveLength(3);

    const completa = await leerMesa();
    expect(completa.completa).toBe(true);
    expect(completa.aviso).toMatchObject({ estado: 'activo' });
    const avisoOriginal = completa.aviso.id;

    const { respuesta, peticion, escrito } = clienteSseFalso();
    suscribir(peticion, respuesta);

    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    const nueva = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante-2', cantidad: 1 });
    expect(nueva.status).toBe(201);

    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);
    expect(envio.status).toBe(200);

    const editada = await leerMesa();
    expect(editada.completa).toBe(false);
    expect(editada.aviso).toBeNull();
    const estados = editada.platos.reduce((acc, plato) => acc + plato.estado, '');
    expect(estados).toContain('listo');
    expect(escrito.join('')).toContain('event: aviso.retirado');

    const nuevaLinea = editada.platos.find((plato) => plato.id === nueva.body.id);
    expect(nuevaLinea.estado).toBe('pendiente');
    await request(app)
      .put(`/api/pedidos/${pedidoId}/lineas/${nuevaLinea.id}/estado`)
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    const reCompleta = await leerMesa();
    expect(reCompleta.completa).toBe(true);
    expect(reCompleta.aviso).toMatchObject({ estado: 'activo' });
    expect(reCompleta.aviso.id).not.toBe(avisoOriginal);
  });
});
