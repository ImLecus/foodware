import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { marcarLinea } from '../../src/services/marcarListo.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

describe('reflejo de la marca en sala', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', platoId: 'plato-entrante-2' });
    app = createApp(db);
  });

  afterEach(() => {
    db?.close();
  });

  it('muestra en sala la línea marcada como lista desde cocina', async () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });

    const respuesta = await request(app).get('/api/mesas/mesa-1/estado-platos');

    const linea = respuesta.body.find((item) => item.id === 'linea-1');
    expect(linea.estado).toBe('listo');
    expect(linea.listoEn).not.toBeNull();
  });

  it('vuelve a pendiente en sala al deshacer la marca', async () => {
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'pendiente' });

    const respuesta = await request(app).get('/api/mesas/mesa-1/estado-platos');
    const linea = respuesta.body.find((item) => item.id === 'linea-1');

    expect(linea.estado).toBe('pendiente');
    expect(linea.listoEn).toBeNull();
  });
});
