import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { diaAnterior, fechaEnMadrid } from '../../src/services/dayTime.js';
import {
  CABECERA_CAMARERO,
  CABECERA_ENCARGADO,
  crearBaseDePrueba,
  crearPedidoEnviado,
  marcarPedidoListo,
} from '../ayuda.js';

describe('Dashboard tras cerrar una cuenta hoy', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  it('muestra el día anterior y no falla por usar el día en curso', async () => {
    db = crearBaseDePrueba();
    app = createApp(db);
    const pedidoId = await crearPedidoEnviado(app);
    await marcarPedidoListo(app, pedidoId);

    const cierre = await request(app)
      .post('/api/sala/mesas/mesa-1/cuenta/cierre')
      .set(CABECERA_CAMARERO)
      .send({ modo: 'unico', total_base_centimos: 3250 });
    expect(cierre.status).toBe(201);

    const informe = await request(app).get('/api/reports/daily').set(CABECERA_ENCARGADO);
    expect(informe.status).toBe(200);
    expect(informe.body.fecha).toBe(diaAnterior(fechaEnMadrid()));
    expect(informe.body.totalVendido).toBe(0);

    const hoy = await request(app)
      .get(`/api/reports/daily?date=${fechaEnMadrid()}`)
      .set(CABECERA_ENCARGADO);
    expect(hoy.status).toBe(400);
  });
});
