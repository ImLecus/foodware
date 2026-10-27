import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { CABECERA_CAMARERO, crearBaseDePrueba, crearPedidoEnviado } from '../ayuda.js';

describe('División de la cuenta (US2)', () => {
  let db;
  let app;
  let pedidoId;

  afterEach(() => {
    db?.close();
  });

  async function preparar() {
    db = crearBaseDePrueba();
    app = createApp(db);
    pedidoId = await crearPedidoEnviado(app);
  }

  function dividir(cuerpo) {
    return request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/division')
      .set(CABECERA_CAMARERO)
      .send(cuerpo);
  }

  it('divide en partes iguales con redondeo y conserva el comensal de cada parte', async () => {
    await preparar();

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

    const partes = db
      .prepare('SELECT orden, comensal, importe_centimos FROM cuentas_partes ORDER BY orden')
      .all();
    expect(partes).toEqual([
      { orden: 1, comensal: 'Ana', importe_centimos: 1084 },
      { orden: 2, comensal: 'Luis', importe_centimos: 1083 },
      { orden: 3, comensal: 'Marta', importe_centimos: 1083 },
    ]);
    expect(partes.reduce((suma, parte) => suma + parte.importe_centimos, 0)).toBe(3250);

    const cuenta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuenta.body.division.partes.map((parte) => parte.comensal)).toEqual([
      'Ana',
      'Luis',
      'Marta',
    ]);
  });

  it('divide por consumo con porciones y persiste cada asignación', async () => {
    await preparar();

    const lineas = db
      .prepare(
        `SELECT l.id, l.plato_id FROM lineas_pedido l
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
        { parte_orden: 1, linea_id: lineaDe('plato-entrante'), importe_centimos: 850 },
        { parte_orden: 1, linea_id: lineaDe('plato-postre'), importe_centimos: 600 },
        { parte_orden: 1, linea_id: lineaDe('plato-principal'), importe_centimos: 900 },
        { parte_orden: 2, linea_id: lineaDe('plato-principal'), importe_centimos: 900 },
      ],
    });

    expect(respuesta.status).toBe(201);

    const asignaciones = db
      .prepare(
        `SELECT cp.orden, cpc.linea_id, cpc.importe_centimos
           FROM cuentas_parte_consumos cpc
           JOIN cuentas_partes cp ON cp.id = cpc.parte_id
          ORDER BY cp.orden, cpc.importe_centimos DESC`,
      )
      .all();
    expect(asignaciones).toHaveLength(4);
    expect(
      asignaciones
        .filter((asignacion) => asignacion.linea_id === lineaDe('plato-principal'))
        .map((asignacion) => asignacion.importe_centimos),
    ).toEqual([900, 900]);
  });

  it('permite rehacer la división cuando la cuenta cambia y no deja rastros de la anterior', async () => {
    await preparar();

    await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });

    db.prepare(
      `INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos)
       VALUES (?, ?, 'plato-postre', 1, 600)`,
    ).run(randomUUID(), pedidoId);

    const conTotalViejo = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });
    expect(conTotalViejo.status).toBe(422);

    const response = await dividir({
      modo: 'iguales',
      total_base_centimos: 3850,
      partes: [
        { orden: 1, comensal: 'Marta', importe_centimos: 1925 },
        { orden: 2, comensal: 'Pablo', importe_centimos: 1925 },
      ],
    });
    expect(response.status).toBe(201);

    const cuentas = db
      .prepare("SELECT COUNT(*) AS total FROM cuentas WHERE mesa_id = 'mesa-1'")
      .get();
    expect(cuentas.total).toBe(1);
    expect(
      db
        .prepare('SELECT COUNT(*) AS total FROM cuentas_partes')
        .get().total,
    ).toBe(2);
    expect(
      db.prepare('SELECT comensal FROM cuentas_partes ORDER BY orden').all(),
    ).toEqual([{ comensal: 'Marta' }, { comensal: 'Pablo' }]);
  });

  async function dividirIgualesYBloquear() {
    await preparar();

    const division = await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });
    expect(division.status).toBe(201);

    const bloqueo = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(bloqueo.status).toBe(200);
  }

  function contarDivision() {
    return {
      cuentas: db.prepare('SELECT COUNT(*) AS total FROM cuentas').get().total,
      partes: db.prepare('SELECT COUNT(*) AS total FROM cuentas_partes').get().total,
      asignaciones: db
        .prepare('SELECT COUNT(*) AS total FROM cuentas_parte_consumos')
        .get().total,
    };
  }

  it('descarta la división al añadir una línea y muestra el total actualizado', async () => {
    await dividirIgualesYBloquear();

    const anadir = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-postre', cantidad: 1 });
    expect(anadir.status).toBe(201);

    const cuenta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuenta.status).toBe(200);
    expect(cuenta.body.total_centimos).toBe(3850);
    expect(cuenta.body.division).toBeNull();
    expect(contarDivision()).toEqual({ cuentas: 0, partes: 0, asignaciones: 0 });
  });

  it('descarta la división al modificar la cantidad de una línea', async () => {
    await dividirIgualesYBloquear();

    const { id: lineaId } = db
      .prepare(
        `SELECT l.id FROM lineas_pedido l
           JOIN pedidos p ON p.id = l.pedido_id
          WHERE p.mesa_id = 'mesa-1' AND l.plato_id = 'plato-entrante'`,
      )
      .get();

    const modificar = await request(app)
      .patch(`/api/pedidos/${pedidoId}/lineas/${lineaId}`)
      .set(CABECERA_CAMARERO)
      .send({ cantidad: 2 });
    expect(modificar.status).toBe(200);

    const cuenta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuenta.body.total_centimos).toBe(4100);
    expect(cuenta.body.division).toBeNull();
    expect(contarDivision()).toEqual({ cuentas: 0, partes: 0, asignaciones: 0 });
  });

  it('permite retirar una línea asignada en una división por consumo sin error', async () => {
    await preparar();

    const lineas = db
      .prepare(
        `SELECT l.id, l.plato_id FROM lineas_pedido l
           JOIN pedidos p ON p.id = l.pedido_id
          WHERE p.mesa_id = 'mesa-1'`,
      )
      .all();
    const lineaDe = (platoId) => lineas.find((linea) => linea.plato_id === platoId).id;

    const division = await dividir({
      modo: 'por_consumo',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 2350 },
        { orden: 2, comensal: 'Luis', importe_centimos: 900 },
      ],
      asignaciones: [
        { parte_orden: 1, linea_id: lineaDe('plato-entrante'), importe_centimos: 850 },
        { parte_orden: 1, linea_id: lineaDe('plato-principal'), importe_centimos: 900 },
        { parte_orden: 1, linea_id: lineaDe('plato-postre'), importe_centimos: 600 },
        { parte_orden: 2, linea_id: lineaDe('plato-principal'), importe_centimos: 900 },
      ],
    });
    expect(division.status).toBe(201);

    const bloqueo = await request(app)
      .post(`/api/pedidos/${pedidoId}/editar`)
      .set(CABECERA_CAMARERO);
    expect(bloqueo.status).toBe(200);

    const retirar = await request(app)
      .delete(`/api/pedidos/${pedidoId}/lineas/${lineaDe('plato-entrante')}`)
      .set(CABECERA_CAMARERO);
    expect(retirar.status).toBe(204);

    const cuenta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuenta.body.total_centimos).toBe(2400);
    expect(cuenta.body.division).toBeNull();
    expect(contarDivision()).toEqual({ cuentas: 0, partes: 0, asignaciones: 0 });
  });

  it('GET /cuenta descarta una división obsoleta si el total cambia fuera de la API', async () => {
    await preparar();

    await dividir({
      modo: 'iguales',
      total_base_centimos: 3250,
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 1625 },
        { orden: 2, comensal: 'Luis', importe_centimos: 1625 },
      ],
    });

    db.prepare(
      "UPDATE lineas_pedido SET cantidad = cantidad + 1 WHERE plato_id = 'plato-entrante'",
    ).run();

    const cuenta = await request(app)
      .get('/api/sala/mesas/mesa-1/cuenta')
      .set(CABECERA_CAMARERO);
    expect(cuenta.status).toBe(200);
    expect(cuenta.body.total_centimos).toBe(4100);
    expect(cuenta.body.division).toBeNull();
    expect(contarDivision()).toEqual({ cuentas: 0, partes: 0, asignaciones: 0 });
  });

  it('descarta la división al anular un pedido en curso sin romper las asignaciones', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);

    const abrir = await request(app)
      .post('/api/mesas/mesa-2/abrir')
      .set(CABECERA_CAMARERO);
    expect(abrir.status).toBe(201);
    pedidoId = abrir.body.id;

    const anadir = await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-principal', cantidad: 1 });
    expect(anadir.status).toBe(201);

    const division = await request(app)
      .post('/api/sala/mesas/mesa-2/cuenta/division')
      .set(CABECERA_CAMARERO)
      .send({
        modo: 'iguales',
        total_base_centimos: 1800,
        partes: [
          { orden: 1, comensal: 'Ana', importe_centimos: 900 },
          { orden: 2, comensal: 'Luis', importe_centimos: 900 },
        ],
      });
    expect(division.status).toBe(201);
    expect(contarDivision().cuentas).toBe(1);

    const anular = await request(app)
      .post(`/api/pedidos/${pedidoId}/anular`)
      .set(CABECERA_CAMARERO);
    expect(anular.status).toBe(204);
    expect(contarDivision()).toEqual({ cuentas: 0, partes: 0, asignaciones: 0 });
  });
});
