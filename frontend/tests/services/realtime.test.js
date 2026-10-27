import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventSourceFalso } from '../ayuda/eventSourceFalso.js';
import { suscribirASala } from '../../src/services/realtime.js';

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
