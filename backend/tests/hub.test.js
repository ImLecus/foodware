import { afterEach, describe, expect, it } from 'vitest';
import { numeroDeClientes, publicar, reiniciarHub, suscribir } from '../src/realtime/hub.js';

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

describe('hub SSE', () => {
  afterEach(() => {
    reiniciarHub();
  });

  it('registra clientes y difunde eventos con formato SSE', () => {
    const { respuesta, peticion, escrito } = clienteFalso();

    suscribir(peticion, respuesta);
    expect(numeroDeClientes()).toBe(1);

    publicar('pedido-confirmado', { pedidoId: 'pedido-1' });

    const contenido = escrito.join('');
    expect(contenido).toContain('event: pedido-confirmado');
    expect(contenido).toContain('data: {"pedidoId":"pedido-1"}');
  });

  it('cierra y limpia las suscripciones al reiniciar', () => {
    const { respuesta, peticion } = clienteFalso();
    suscribir(peticion, respuesta);

    reiniciarHub();

    expect(numeroDeClientes()).toBe(0);
  });
});
