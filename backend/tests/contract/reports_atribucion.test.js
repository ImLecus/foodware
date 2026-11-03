import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_ENCARGADO, crearAppDePrueba } from '../ayuda.js';

describe('Informes · atribución por camarero', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  it('atribuye la venta al camarero que abrió el pedido y usa el que cerró como respaldo', async () => {
    ({ db, app } = crearAppDePrueba());

    db.prepare(
      `INSERT INTO pedidos (id, mesa_id, camarero_id, estado, enviado_en)
       VALUES ('pedido-atribucion', 'mesa-1', 'camarero-1', 'enviada', '2026-10-20 11:00:00')`,
    ).run();
    db.prepare(
      `INSERT INTO cuentas
         (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES ('cuenta-atribucion', 'mesa-1', 'pedido-atribucion', 'camarero-2', 'cerrada', 100,
               '2026-10-20 11:00:00', '2026-10-20 12:00:00')`,
    ).run();
    db.prepare(
      `INSERT INTO cuentas
         (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES ('cuenta-historica', 'mesa-1', NULL, 'camarero-2', 'cerrada', 50,
               '2026-10-20 13:00:00', '2026-10-20 14:00:00')`,
    ).run();

    const respuesta = await request(app)
      .get('/api/reports/daily?date=2026-10-20')
      .set(CABECERA_ENCARGADO);

    expect(respuesta.status).toBe(200);
    const porCamarero = respuesta.body.porCamarero;
    expect(porCamarero.find((fila) => fila.camareroId === 'camarero-1')).toMatchObject({
      importe: 1,
      numeroCuentas: 1,
    });
    expect(porCamarero.find((fila) => fila.camareroId === 'camarero-2')).toMatchObject({
      importe: 0.5,
      numeroCuentas: 1,
    });
  });
});
