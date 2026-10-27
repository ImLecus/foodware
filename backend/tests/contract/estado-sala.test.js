import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { emitirLineaActualizada } from '../../src/realtime/emit.js';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';

function clienteFalso() {
  const escrito = [];
  const respuesta = {
    writeHead: () => {},
    write: (trozo) => escrito.push(String(trozo)),
    end: () => {},
  };
  return { respuesta, peticion: { on: () => {} }, escrito };
}

describe('GET /api/mesas/:mesaId/estado-platos', () => {
  let db;
  let app;

  beforeEach(() => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', estado: 'listo' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', platoId: 'plato-entrante-2' });
    app = createApp(db);
  });

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  it('devuelve los platos de la mesa con su estado y listoEn', async () => {
    const respuesta = await request(app).get('/api/mesas/mesa-1/estado-platos');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([
      {
        id: 'linea-1',
        pedidoId: 'pedido-1',
        nombrePlato: 'Croquetas',
        cantidad: 1,
        estado: 'listo',
        listoEn: '2026-10-20T10:05:00.000Z',
      },
      {
        id: 'linea-2',
        pedidoId: 'pedido-1',
        nombrePlato: 'Ensalada',
        cantidad: 1,
        estado: 'pendiente',
        listoEn: null,
      },
    ]);
  });

  it('devuelve 404 si la mesa no existe', async () => {
    const respuesta = await request(app).get('/api/mesas/inexistente/estado-platos');
    expect(respuesta.status).toBe(404);
  });

  it('emite linea.actualizada con pedido, línea y estado', () => {
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    emitirLineaActualizada({ pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });

    const contenido = escrito.join('');
    expect(contenido).toContain('event: linea.actualizada');
    expect(contenido).toContain('"pedidoId":"pedido-1"');
    expect(contenido).toContain('"lineaId":"linea-1"');
    expect(contenido).toContain('"estado":"listo"');
  });
});
