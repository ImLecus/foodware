import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { CABECERA_CAMARERO, crearBaseDePrueba, crearPedidoEnviado } from '../ayuda.js';

describe('POST /api/sala/mesas/:mesaId/cuenta/division', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  async function prepararConPedido() {
    db = crearBaseDePrueba();
    app = createApp(db);
    await crearPedidoEnviado(app);
  }

  function dividir(cuerpo) {
    return request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/division')
      .set(CABECERA_CAMARERO)
      .send(cuerpo);
  }

  it('confirma una división en partes iguales con reparto exacto de céntimos', async () => {
    await prepararConPedido();

    const respuesta = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1084 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1083 },
        { orden: 3, comensal: 'Marta', importe_centimos: 1083 },
      ],
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.cuenta).toMatchObject({
      mesa_id: 'mesa-1',
      estado: 'abierta',
      total_centimos: 3250,
      modo_division: 'iguales',
      ticket_estado: 'no_emitido',
    });
    expect(respuesta.body.division.modo).toBe('iguales');
    expect(respuesta.body.division.partes).toHaveLength(3);
    expect(respuesta.body.division.partes.map((parte) => parte.comensal)).toEqual([
      'Ana',
      'Luis',
      'Marta',
    ]);
    expect(respuesta.body.division.partes[0]).toMatchObject({
      orden: 1,
      comensal: 'Ana',
      importe_centimos: 1084,
      estado: 'pendiente',
      pagada_en: null,
    });

    const comensales = db
      .prepare('SELECT comensal FROM cuentas_partes ORDER BY orden')
      .all()
      .map((fila) => fila.comensal);
    expect(comensales).toEqual(['Ana', 'Luis', 'Marta']);

    const cuenta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuenta.status).toBe(200);
    expect(cuenta.body.division.modo).toBe('iguales');
    expect(cuenta.body.division.partes).toHaveLength(3);
  });

  it('confirma una división por consumo con porciones de un plato compartido', async () => {
    await prepararConPedido();
    const lineas = db
      .prepare(
        `SELECT l.id, l.plato_id
           FROM lineas_pedido l
           JOIN pedidos p ON p.id = l.pedido_id
          WHERE p.mesa_id = 'mesa-1'`,
      )
      .all();
    const lineaDe = (platoId) => lineas.find((linea) => linea.plato_id === platoId).id;

    const respuesta = await dividir({
      modo: 'por_consumo',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 2350 },
        { orden: 2, comensal: 'Luis', importe_centimos: 900 },
      ],
      asignaciones: [
        // Croquetas (850) y tarta (600) para Ana; paella (1800) a medias.
        { parte_orden: 1, linea_id: lineaDe('plato-entrante'), importe_centimos: 850 },
        { parte_orden: 1, linea_id: lineaDe('plato-postre'), importe_centimos: 600 },
        { parte_orden: 1, linea_id: lineaDe('plato-principal'), importe_centimos: 900 },
        { parte_orden: 2, linea_id: lineaDe('plato-principal'), importe_centimos: 900 },
      ],
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.division.modo).toBe('por_consumo');
    expect(respuesta.body.division.asignaciones).toHaveLength(4);
  });

  it('rechaza que la suma de las partes no coincida con el total', async () => {
    await prepararConPedido();

    const respuesta = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1000 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1000 },
      ],
    });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toMatch(/suma/i);
  });

  it('rechaza la división si el total base ha cambiado', async () => {
    await prepararConPedido();

    const respuesta = await dividir({
      modo: 'iguales',
      total_base_centimos: 3000,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1500 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1500 },
      ],
    });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toMatch(/total/i);
  });

  it('rechaza asignaciones que no cubren exactamente los consumos', async () => {
    await prepararConPedido();
    const linea = db
      .prepare(
        `SELECT l.id FROM lineas_pedido l
           JOIN pedidos p ON p.id = l.pedido_id
          WHERE p.mesa_id = 'mesa-1'
          ORDER BY l.rowid LIMIT 1`,
      )
      .get();

    const respuesta = await dividir({
      modo: 'por_consumo',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 3250 },
        { orden: 2, comensal: 'Luis', importe_centimos: 0 },
      ],
      asignaciones: [
        { parte_orden: 1, linea_id: linea.id, importe_centimos: 850 },
      ],
    });

    expect(respuesta.status).toBe(422);
    expect(respuesta.body.error).toMatch(/cubrir/i);
  });

  it('sustituye una división cuyas partes siguen pendientes', async () => {
    await prepararConPedido();

    await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });

    const respuesta = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Marta', importe_centimos: 1625 },
        { orden: 2, comensal: 'Pablo', importe_centimos: 1625 },
      ],
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.division.partes.map((parte) => parte.comensal)).toEqual([
      'Marta',
      'Pablo',
    ]);

    const cuentas = db.prepare("SELECT COUNT(*) AS total FROM cuentas WHERE mesa_id = 'mesa-1'").get();
    expect(cuentas.total).toBe(1);
  });

  it('rechaza sustituir una división con alguna parte pagada', async () => {
    await prepararConPedido();

    await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });

    db.prepare(
      "UPDATE cuentas_partes SET estado = 'pagada', pagada_en = datetime('now') WHERE orden = 1",
    ).run();

    const respuesta = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Marta', importe_centimos: 1625 },
        { orden: 2, comensal: 'Pablo', importe_centimos: 1625 },
      ],
    });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/pagada/i);
  });

  it('rechaza dividir una cuenta ya cerrada', async () => {
    await prepararConPedido();
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, estado, total_centimos, modo_division, cerrada_en)
       VALUES (?, 'mesa-1', 'cerrada', 3250, 'unico', datetime('now'))`,
    ).run(randomUUID());
    db.prepare("UPDATE mesas SET estado = 'cerrada' WHERE id = 'mesa-1'").run();

    const respuesta = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toMatch(/cerrada/i);
  });

  it('rechaza una división sin comensal en alguna parte', async () => {
    await prepararConPedido();

    const respuesta = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: '', importe_centimos: 1625 },
      ],
    });

    expect(respuesta.status).toBe(400);
  });

  it('devuelve 404 si la mesa no existe', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);

    const respuesta = await request(app)
      .post('/api/sala/mesas/mesa-inexistente/cuenta/division')
      .set(CABECERA_CAMARERO)
      .send({
        modo: 'iguales',
        total_base_centimos: 0,
        partes: [{ orden: 1, comensal: 'Ana', importe_centimos: 0 }],
      });

    expect(respuesta.status).toBe(404);
  });
});
