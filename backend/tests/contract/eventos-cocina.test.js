import { once } from 'node:events';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  emitirLineaActualizada,
  emitirPedidoNuevo,
  emitirPendientesCambiado,
} from '../../src/realtime/emit.js';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import { crearBase } from '../helpers/fixtures.js';

function clienteFalso() {
  const escrito = [];
  const respuesta = {
    writeHead: () => {},
    write: (trozo) => escrito.push(String(trozo)),
    end: () => {},
  };
  const peticion = { on: () => {} };
  return { respuesta, peticion, escrito };
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

describe('SSE de cocina', () => {
  let db;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  it('expone el canal SSE por partida', async () => {
    db = crearBase();
    const app = createApp(db);
    const { respuesta, cerrar } = await abrirEventos(app, '/api/partidas/entrantes/eventos');

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers.get('content-type')).toContain('text/event-stream');

    await cerrar();
  });

  it('devuelve 404 si la partida del canal no existe', async () => {
    db = crearBase();
    const app = createApp(db);
    const { respuesta, cerrar } = await abrirEventos(app, '/api/partidas/bar/eventos');

    expect(respuesta.status).toBe(404);
    await cerrar();
  });

  it('emite pedido.nuevo con pedido, mesa y partida', () => {
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    emitirPedidoNuevo({ pedidoId: 'pedido-1', mesa: 3, partida: 'entrantes' });

    const contenido = escrito.join('');
    expect(contenido).toContain('event: pedido.nuevo');
    expect(contenido).toContain('"pedidoId":"pedido-1"');
    expect(contenido).toContain('"mesa":3');
  });

  it('emite pedido.pendientes-cambiado y linea.actualizada', () => {
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    emitirPendientesCambiado({ partida: 'entrantes' });
    emitirLineaActualizada({ pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });

    const contenido = escrito.join('');
    expect(contenido).toContain('event: pedido.pendientes-cambiado');
    expect(contenido).toContain('event: linea.actualizada');
    expect(contenido).toContain('"estado":"listo"');
  });
});
