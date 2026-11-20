import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { marcarLinea } from '../../src/services/marcarListo.js';
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

describe('eventos al deshacer la última marca', () => {
  let db;

  beforeEach(() => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1', enviadoEn: '2026-10-20 09:00:00' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', platoId: 'plato-entrante-2' });
  });

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  it('emite linea.actualizada y pedido.reabierto', () => {
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-1', estado: 'listo' });
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-2', estado: 'listo' });
    marcarLinea(db, { pedidoId: 'pedido-1', lineaId: 'linea-2', estado: 'pendiente' });

    const contenido = escrito.join('');
    expect(contenido).toContain('event: linea.actualizada');
    expect(contenido).toContain('event: pedido.reabierto');
    expect(contenido).toContain('"tipo":"pedido.reabierto"');
    expect(contenido).toContain('"pedidoId":"pedido-1"');
    expect(contenido).toContain('"mesaId":"mesa-1"');
    expect(contenido).toContain('"lineaId":"linea-2"');
  });
});
