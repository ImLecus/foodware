import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { reiniciarHub, suscribir } from '../src/realtime/hub.js';
import {
  CABECERA_CAMARERO,
  clienteSseFalso,
  crearAppDePrueba,
  crearPedidoEnviado,
} from './ayuda.js';

describe('Edición · enviar cambios', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  async function prepararBloqueado() {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    await request(app).post(`/api/pedidos/${pedidoId}/editar`).set(CABECERA_CAMARERO);
    return pedidoId;
  }

  async function anadirPlato(pedidoId) {
    return request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante-2', cantidad: 1 });
  }

  it('guardar una edición no comunica nada a cocina por sí sola', async () => {
    const pedidoId = await prepararBloqueado();
    const { respuesta, peticion, escrito } = clienteSseFalso();
    suscribir(peticion, respuesta);

    await anadirPlato(pedidoId);

    const contenido = escrito.join('');
    expect(contenido).not.toContain('event: pedido-modificado');
  });

  it('enviar cambios publica el evento y devuelve el pedido agrupado', async () => {
    const pedidoId = await prepararBloqueado();
    await anadirPlato(pedidoId);

    const { respuesta, peticion, escrito } = clienteSseFalso();
    suscribir(peticion, respuesta);

    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);

    expect(envio.status).toBe(200);
    expect(envio.body).toMatchObject({ pedido_id: pedidoId, modificada: true });
    expect(envio.body.por_partida.entrantes).toHaveLength(2);
    expect(envio.body.por_partida.principales).toHaveLength(1);
    expect(envio.body.por_partida.postres).toHaveLength(1);

    const contenido = escrito.join('');
    expect(contenido).toContain('event: pedido-modificado');
    expect(contenido).toContain(pedidoId);
  });

  it('rechaza enviar cambios si no hay cambios pendientes', async () => {
    const pedidoId = await prepararBloqueado();

    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);

    expect(envio.status).toBe(409);
    expect(envio.body.codigo).toBe('sin_cambios');
  });

  it('rechaza enviar cambios sin el bloqueo de edición', async () => {
    const pedidoId = await prepararBloqueado();
    await anadirPlato(pedidoId);
    db.prepare(
      "UPDATE pedidos SET bloqueo_expira_en = datetime('now', '-1 minute') WHERE id = ?",
    ).run(pedidoId);

    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);

    expect(envio.status).toBe(409);
    expect(envio.body.codigo).toBe('bloqueo_expirado');
  });
});
