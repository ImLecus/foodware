import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../src/config/logger.js';
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
    vi.restoreAllMocks();
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

  it('solo entrega los eventos de una partida a su canal', () => {
    const entrantes = clienteFalso();
    const principales = clienteFalso();
    suscribir(entrantes.peticion, entrantes.respuesta, 'entrantes');
    suscribir(principales.peticion, principales.respuesta, 'principales');

    publicar('pedido.nuevo', { tipo: 'pedido.nuevo', partida: 'entrantes', pedidoId: 'p-1' });

    expect(entrantes.escrito.join('')).toContain('event: pedido.nuevo');
    expect(principales.escrito.join('')).not.toContain('event: pedido.nuevo');
  });

  it('registra la emisión de cada evento', () => {
    const espia = vi.spyOn(logger, 'info').mockImplementation(() => {});
    const { respuesta, peticion } = clienteFalso();
    suscribir(peticion, respuesta);

    publicar('pedido.nuevo', { tipo: 'pedido.nuevo', partida: 'entrantes', pedidoId: 'p-1' });

    expect(espia).toHaveBeenCalledWith(
      'Evento SSE emitido',
      expect.objectContaining({ evento: 'pedido.nuevo', partida: 'entrantes', pedidoId: 'p-1' }),
    );
  });

  it('cierra y limpia las suscripciones al reiniciar', () => {
    const { respuesta, peticion } = clienteFalso();
    suscribir(peticion, respuesta, 'entrantes');

    reiniciarHub();

    expect(numeroDeClientes()).toBe(0);
  });
});
