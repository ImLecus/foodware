import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  CABECERA_CAMARERO,
  crearBaseDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Cierre de cuenta con pago único (US1)', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function preparar() {
    db = crearBaseDePrueba();
    app = createApp(db);
    const pedidoId = await crearPedidoEnviado(app);
    await marcarPedidoListo(app, pedidoId);
  }

  it('muestra el total, permite cancelar sin cambios y libera la mesa con un pago único', async () => {
    await preparar();

    const abierta = await request(app).get('/api/sala/mesas/mesa-1/cuenta').set(CABECERA_CAMARERO);

    expect(abierta.status).toBe(200);
    expect(abierta.body.total_centimos).toBe(3250);
    expect(abierta.body.estado).toBe('abierta');

    // Cancelar el cierre no modifica nada: la mesa sigue ocupada y la cuenta abierta.
    const mesaAntes = db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get();
    expect(mesaAntes.estado).toBe('ocupada');

    const cierre = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });

    expect(cierre.status).toBe(201);
    expect(cierre.body.cuenta).toMatchObject({
      mesa_id: 'mesa-1',
      estado: 'cerrada',
      total_centimos: 3250,
    });
    expect(cierre.body.cuenta.cerrada_en).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(cierre.body.ticket_estado).toBe('emitido');
    expect(cierre.body.ticket).toMatchObject({
      estado: 'emitido',
      mesa_id: 'mesa-1',
      total_centimos: 3250,
      partes: [],
    });

    const mesaDespues = db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get();
    expect(mesaDespues.estado).toBe('libre');

    const cuentaCerrada = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuentaCerrada.status).toBe(409);

    const repetido = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });
    expect(repetido.status).toBe(409);

    const nueva = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    expect(nueva.status).toBe(201);
  });

  it('bloquea el cierre mientras haya platos pendientes en cocina', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);
    await crearPedidoEnviado(app);

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body).toMatchObject({
      codigo: 'platos_pendientes',
      mensaje: 'Hay platos pendientes en cocina',
    });
    expect(respuesta.body.platos).toHaveLength(3);
    expect(db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get().estado).toBe('ocupada');
    expect(
      db.prepare("SELECT COUNT(*) AS total FROM cuentas WHERE mesa_id = 'mesa-1'").get().total,
    ).toBe(0);
  });

  it('rechaza el cierre si el total ha cambiado y mantiene la mesa ocupada', async () => {
    await preparar();

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3000 });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toMatch(/total/i);

    const mesa = db.prepare("SELECT estado FROM mesas WHERE id = 'mesa-1'").get();
    expect(mesa.estado).toBe('ocupada');
  });

  it('rechaza el cierre de una cuenta sin importe', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);
    await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 0 });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toMatch(/sin importe/i);
  });

  it('rechaza un modo de cierre no válido', async () => {
    await preparar();

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'iguales', total_base_centimos: 3250 });

    expect(respuesta.status).toBe(400);
  });

  it('devuelve 404 al cerrar una mesa inexistente', async () => {
    await preparar();

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-inexistente/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 0 });

    expect(respuesta.status).toBe(404);
  });
});
