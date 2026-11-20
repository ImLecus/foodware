import { afterEach, describe, expect, it } from 'vitest';
import { emitirPedidoModificado } from '../../src/realtime/emit.js';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';

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

describe('evento pedido.modificado', () => {
  afterEach(() => {
    reiniciarHub();
  });

  it('emite pedido.modificado con pedido, partida y momento de edición', () => {
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    emitirPedidoModificado({
      pedidoId: 'pedido-1',
      partida: 'entrantes',
      modificadoEn: '2026-10-20T10:30:00.000Z',
    });

    const contenido = escrito.join('');
    expect(contenido).toContain('event: pedido.modificado');
    expect(contenido).toContain('"tipo":"pedido.modificado"');
    expect(contenido).toContain('"pedidoId":"pedido-1"');
    expect(contenido).toContain('"partida":"entrantes"');
    expect(contenido).toContain('"modificado":true');
    expect(contenido).toContain('"modificadoEn":"2026-10-20T10:30:00.000Z"');
  });
});
