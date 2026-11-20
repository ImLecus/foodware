import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CABECERA_CAMARERO, crearAppDePrueba } from '../ayuda.js';
import { obtenerDesglosePorPlato } from '../../src/services/reportingService.js';

describe('Carta · histórico compartido con pedidos e informes', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  it('un cambio de nombre o partida no altera pedidos ni dashboard', async () => {
    ({ db, app } = crearAppDePrueba());
    const abierto = await request(app).post('/api/mesas/mesa-1/abrir').set(CABECERA_CAMARERO);
    const pedidoId = abierto.body.id;
    await request(app)
      .post(`/api/pedidos/${pedidoId}/lineas`)
      .set(CABECERA_CAMARERO)
      .send({ plato_id: 'plato-entrante', cantidad: 1 });
    await request(app).post(`/api/pedidos/${pedidoId}/confirmar`).set(CABECERA_CAMARERO);

    db.prepare(
      `UPDATE platos
          SET nombre = 'Croquetas del día', partida_codigo = 'postres'
        WHERE id = 'plato-entrante'`,
    ).run();

    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
    expect(pedido.body.lineas[0]).toMatchObject({
      plato_nombre: 'Croquetas de jamón',
      partida: 'entrantes',
    });

    db.prepare(
      `INSERT INTO cuentas
         (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
       VALUES ('cuenta-historico', 'mesa-1', ?, 'camarero-1', 'cerrada', 850,
               '2026-10-20 11:00:00', '2026-10-20 12:00:00')`,
    ).run(pedidoId);

    const plato = obtenerDesglosePorPlato(db, '2026-10-20').find(
      (fila) => fila.nombre === 'Croquetas de jamón',
    );
    expect(plato).toMatchObject({ partida: 'entrantes', cantidad: 1 });
  });
});
