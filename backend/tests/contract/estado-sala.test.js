import { once } from 'node:events';
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

async function abrirEventos(app, ruta) {
  const servidor = app.listen(0);
  await once(servidor, 'listening');
  const { port } = servidor.address();
  const controlador = new AbortController();
  const respuesta = await fetch(`http://127.0.0.1:${port}${ruta}`, {
    signal: controlador.signal,
  });
  return {
    respuesta,
    cerrar: async () => {
      controlador.abort();
      servidor.close();
    },
  };
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

  it('expone el canal SSE por mesa', async () => {
    const { respuesta, cerrar } = await abrirEventos(app, '/api/mesas/mesa-1/eventos');

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('content-type')).toContain('text/event-stream');
    await cerrar();
  });

  it('devuelve 404 si la mesa del canal no existe', async () => {
    const { respuesta, cerrar } = await abrirEventos(app, '/api/mesas/inexistente/eventos');

    expect(respuesta.status).toBe(404);
    await cerrar();
  });

  it('emite linea.actualizada con la forma del contrato en el canal de la mesa', () => {
    const mesa = clienteFalso();
    const otraMesa = clienteFalso();
    suscribir(mesa.peticion, mesa.respuesta, { mesaId: 'mesa-1' });
    suscribir(otraMesa.peticion, otraMesa.respuesta, { mesaId: 'mesa-2' });

    emitirLineaActualizada({
      pedidoId: 'pedido-1',
      lineaId: 'linea-1',
      estado: 'listo',
      listoEn: '2026-10-20T10:05:00.000Z',
      mesa: 1,
      mesaId: 'mesa-1',
      partida: 'entrantes',
      nombrePlato: 'Croquetas',
      cantidad: 2,
    });

    const contenido = mesa.escrito.join('');
    expect(contenido).toContain('event: linea.actualizada');
    expect(contenido).toContain('"tipo":"linea.actualizada"');
    expect(contenido).toContain('"pedidoId":"pedido-1"');
    expect(contenido).toContain('"lineaId":"linea-1"');
    expect(contenido).toContain('"mesaId":"mesa-1"');
    expect(contenido).toContain('"linea":{"id":"linea-1"');
    expect(contenido).toContain('"estado":"listo"');
    expect(otraMesa.escrito.join('')).not.toContain('event: linea.actualizada');
  });
});
