import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  CABECERA_CAMARERO,
  CABECERA_CAMARERO_2,
  crearAppDePrueba,
  crearPedidoEnviado,
} from './ayuda.js';

describe('Edición · liberación del bloqueo', () => {
  let db;
  let app;

  afterEach(() => {
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

  it('enviar cambios libera el bloqueo', async () => {
    const pedidoId = await prepararBloqueado();
    await anadirPlato(pedidoId);

    const envio = await request(app)
      .post(`/api/pedidos/${pedidoId}/enviar-cambios`)
      .set(CABECERA_CAMARERO);
    expect(envio.status).toBe(200);

    const bloqueo = await request(app)
      .get(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);
    expect(bloqueo.body.estado).toBe('libre');

    const apertura = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);
    expect(apertura.status).toBe(200);
    expect(apertura.body.bloqueo.camarero_id).toBe('camarero-2');
  });

  it('cancelar o salir de la edición libera el bloqueo', async () => {
    const pedidoId = await prepararBloqueado();

    const salida = await request(app)
      .delete(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(salida.status).toBe(204);

    const apertura = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);
    expect(apertura.status).toBe(200);
  });

  it('la inactividad libera el bloqueo de forma perezosa', async () => {
    const pedidoId = await prepararBloqueado();

    db.prepare(
      `UPDATE pedidos
          SET editando_ultima_actividad = datetime('now', '-30 minutes'),
              bloqueo_expira_en = datetime('now', '-15 minutes')
        WHERE id = ?`,
    ).run(pedidoId);

    const consulta = await request(app)
      .get(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(consulta.body.estado).toBe('expirado');

    const escritura = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/linea-inexistente`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 2 });
    expect(escritura.status).toBe(409);
    expect(escritura.body.codigo).toBe('bloqueo_expirado');

    const apertura = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO_2);
    expect(apertura.status).toBe(200);
  });

  it('el propietario renueva el bloqueo al volver a abrirlo', async () => {
    const pedidoId = await prepararBloqueado();

    const reapertura = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);

    expect(reapertura.status).toBe(200);
    expect(reapertura.body.editando_por).toBe('camarero-1');
  });
});
