import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { suscribirASala } from '../../src/services/realtime.js';

/** EventSource mínimo que permite emitir eventos desde la prueba. */
class EventSourceFalso {
  static instancias = [];

  constructor(url) {
    this.url = url;
    this.oyentes = new Map();
    this.cerrada = false;
    EventSourceFalso.instancias.push(this);
  }

  addEventListener(nombre, handler) {
    const lista = this.oyentes.get(nombre) ?? [];
    lista.push(handler);
    this.oyentes.set(nombre, lista);
  }

  removeEventListener(nombre, handler) {
    const lista = this.oyentes.get(nombre) ?? [];
    this.oyentes.set(
      nombre,
      lista.filter((oyente) => oyente !== handler),
    );
  }

  close() {
    this.cerrada = true;
  }

  emitir(nombre, datos) {
    for (const handler of this.oyentes.get(nombre) ?? []) {
      handler({ data: JSON.stringify(datos) });
    }
  }
}

describe('suscribirASala', () => {
  const EventSourceOriginal = globalThis.EventSource;

  beforeEach(() => {
    EventSourceFalso.instancias = [];
    globalThis.EventSource = EventSourceFalso;
  });

  afterEach(() => {
    globalThis.EventSource = EventSourceOriginal;
  });

  it('escucha mesa-cerrada y entrega sus datos al manejador', () => {
    const onEvento = vi.fn();
    suscribirASala({ onEvento });

    const [conexion] = EventSourceFalso.instancias;
    conexion.emitir('mesa-cerrada', {
      mesa_id: 'mesa-1',
      cuenta_id: 'cuenta-1',
      cerrada_en: '2026-10-27T20:00:00.000Z',
    });

    expect(onEvento).toHaveBeenCalledWith('mesa-cerrada', {
      mesa_id: 'mesa-1',
      cuenta_id: 'cuenta-1',
      cerrada_en: '2026-10-27T20:00:00.000Z',
    });
  });

  it('al desuscribirse retira los oyentes y cierra el canal', () => {
    const onEvento = vi.fn();
    const cerrar = suscribirASala({ onEvento });

    const [conexion] = EventSourceFalso.instancias;
    cerrar();
    conexion.emitir('mesa-cerrada', { mesa_id: 'mesa-1' });

    expect(onEvento).not.toHaveBeenCalled();
    expect(conexion.cerrada).toBe(true);
  });
});
