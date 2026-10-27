import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { obtenerAviso } from '../../src/db/avisos.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { CABECERA_CAMARERO } from '../ayuda.js';

describe('POST /api/sala/avisos/:avisoId/descartar', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function prepararConAviso() {
    db = crearBase();
    app = createApp(db);
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });

    const marca = await request(app)
      .put('/api/pedidos/pedido-1/lineas/linea-1/estado')
      .set(CABECERA_CAMARERO)
      .send({ estado: 'listo' });

    expect(marca.status).toBe(200);
    return marca.body.mesa.aviso.id;
  }

  function descartar(avisoId, cabecera = CABECERA_CAMARERO) {
    return request(app)
      .post(`/api/sala/avisos/${avisoId}/descartar`)
      .set(cabecera);
  }

  it('descarta el aviso y devuelve su estado actualizado', async () => {
    const avisoId = await prepararConAviso();

    const respuesta = await descartar(avisoId);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      aviso_id: avisoId,
      mesa_id: 'mesa-1',
      estado: 'descartado',
    });
    expect(respuesta.body.descartado_en).toEqual(expect.any(String));
    expect(Number.isNaN(Date.parse(respuesta.body.descartado_en))).toBe(false);

    const fila = obtenerAviso(db, avisoId);
    expect(fila.estado).toBe('descartado');
    expect(fila.descartado_en).toBeTruthy();
  });

  it('deja de mostrar el aviso en la instantánea de sala', async () => {
    const avisoId = await prepararConAviso();

    await descartar(avisoId);

    const sala = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);
    const [mesa] = sala.body.mesas;

    expect(mesa.completa).toBe(true);
    expect(mesa.aviso).toBeNull();
  });

  it('es idempotente y no cambia la fecha del primer descarte', async () => {
    const avisoId = await prepararConAviso();

    const primero = await descartar(avisoId);
    const segundo = await descartar(avisoId);

    expect(segundo.status).toBe(200);
    expect(segundo.body).toEqual(primero.body);
  });

  it('devuelve 404 si el aviso no existe', async () => {
    db = crearBase();
    app = createApp(db);

    const respuesta = await descartar('aviso-inexistente');

    expect(respuesta.status).toBe(404);
  });

  it('exige un camarero identificado', async () => {
    const avisoId = await prepararConAviso();

    const respuesta = await request(app).post(`/api/sala/avisos/${avisoId}/descartar`);

    expect(respuesta.status).toBe(401);
  });
});
