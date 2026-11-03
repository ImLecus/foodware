import { afterEach, describe, expect, it } from 'vitest';
import { crearAppDePrueba, crearPedidoEnviado } from '../ayuda.js';
import { listarConsumos } from '../../src/services/cuentasService.js';

describe('Consumos · instantánea histórica', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  it('conserva el nombre y la partida fijados al pedir aunque cambie la carta', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);

    db.prepare(
      `UPDATE platos
          SET nombre = 'Croquetas del día', partida_codigo = 'postres'
        WHERE id = 'plato-entrante'`,
    ).run();

    const consumo = listarConsumos(db, pedidoId).find(
      (fila) => fila.linea_id !== undefined && fila.nombre.includes('Croquetas'),
    );

    expect(consumo).toMatchObject({
      nombre: 'Croquetas de jamón',
      partida: 'entrantes',
    });
  });
});
