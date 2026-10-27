import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { CABECERA_CAMARERO, crearBaseDePrueba, crearPedidoEnviado } from '../ayuda.js';

describe('Cierre de cuenta con pago único (US1)', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    db = crearBaseDePrueba();
    app = createApp(db);
  }

  it('muestra el total, permite cancelar sin cambios y cierra la mesa con un pago único', async () => {
    preparar();
    await crearPedidoEnviado(app);

    const abierta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);

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
    expect(mesaDespues.estado).toBe('cerrada');

    const cuentaCerrada = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuentaCerrada.status).toBe(409);

    const repetido = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });
    expect(repetido.status).toBe(409);
  });

  it('rechaza el cierre si el total ha cambiado y mantiene la mesa abierta', async () => {
    preparar();
    await crearPedidoEnviado(app);

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
    preparar();

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 0 });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toMatch(/sin importe/i);
  });

  it('rechaza un modo de cierre no válido', async () => {
    preparar();
    await crearPedidoEnviado(app);

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'iguales', total_base_centimos: 3250 });

    expect(respuesta.status).toBe(400);
  });

  it('devuelve 404 al cerrar una mesa inexistente', async () => {
    preparar();

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-inexistente/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 0 });

    expect(respuesta.status).toBe(404);
  });
});
