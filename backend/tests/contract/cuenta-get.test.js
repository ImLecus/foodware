import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBaseDePrueba, crearPedidoEnviado, CABECERA_CAMARERO } from '../ayuda.js';

describe('GET /api/sala/mesas/:mesaId/cuenta', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    db = crearBaseDePrueba();
    app = createApp(db);
  }

  it('devuelve el total en céntimos a partir de los consumos con el precio fijado al pedir', async () => {
    preparar();
    await crearPedidoEnviado(app);
    // El precio de la carta cambia después de pedir: la cuenta debe conservar el del pedido.
    db.prepare("UPDATE platos SET precio_centimos = 9999 WHERE id = 'plato-entrante'").run();

    const respuesta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      mesa_id: 'mesa-1',
      identificador: 'Mesa 1',
      estado: 'abierta',
      total_centimos: 3250,
      division: null,
      ticket_estado: 'no_emitido',
    });

    expect(respuesta.body.pedido_id).toEqual(expect.any(String));
    expect(respuesta.body.platos_pendientes).toHaveLength(3);
    expect(respuesta.body.platos_pendientes[0]).toMatchObject({
      nombre: 'Croquetas de jamón',
      partida: 'entrantes',
      estado: 'pendiente',
    });

    expect(respuesta.body.consumos).toHaveLength(3);
    expect(respuesta.body.consumos.map((consumo) => consumo.nombre)).toEqual([
      'Croquetas de jamón',
      'Paella de marisco',
      'Tarta de queso',
    ]);
    expect(respuesta.body.consumos[0]).toMatchObject({
      cantidad: 1,
      precio_centimos: 850,
      importe_centimos: 850,
      partida: 'entrantes',
    });
    expect(
      respuesta.body.consumos.every(
        (consumo) => consumo.importe_centimos === consumo.cantidad * consumo.precio_centimos,
      ),
    ).toBe(true);
  });

  it('devuelve total cero y sin consumos para una mesa vacía', async () => {
    preparar();

    const respuesta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total_centimos).toBe(0);
    expect(respuesta.body.consumos).toEqual([]);
    expect(respuesta.body.division).toBeNull();
  });

  it('devuelve 404 si la mesa no existe', async () => {
    preparar();

    const respuesta = await request(app)
      .get('/api/sala/mesas/mesa-inexistente/cuenta')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.error).toMatch(/mesa/i);
  });

  it('devuelve 409 si la cuenta ya está cerrada', async () => {
    preparar();
    db.prepare(
      "INSERT INTO cuentas (id, mesa_id, estado, total_centimos) VALUES ('cuenta-1', 'mesa-1', 'cerrada', 3250)",
    ).run();
    db.prepare("UPDATE mesas SET estado = 'cerrada' WHERE id = 'mesa-1'").run();

    const respuesta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/cerrada/i);
  });
});
