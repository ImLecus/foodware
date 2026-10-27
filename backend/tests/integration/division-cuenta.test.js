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
});
