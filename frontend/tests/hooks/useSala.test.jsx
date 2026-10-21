import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSala } from '../../src/hooks/useSala.js';
import { obtenerMesasSala } from '../../src/services/api.js';
import { suscribirASala } from '../../src/services/realtime.js';

vi.mock('../../src/services/api.js', () => ({
  obtenerMesasSala: vi.fn(),
}));

vi.mock('../../src/services/realtime.js', () => ({
  suscribirASala: vi.fn(() => () => {}),
}));

const instantanea = (mesas) => ({ generado_en: '2026-10-21T09:00:00.000Z', mesas });

/** Captura el manejador de eventos que la vista registra en el canal de sala. */
function capturarSuscripcion() {
  let manejador;
  suscribirASala.mockImplementation(({ onEvento, onEstadoConexion } = {}) => {
    manejador = { onEvento, onEstadoConexion };
    return () => {};
  });
  return () => manejador;
}

describe('useSala', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga la instantánea de sala al montar', async () => {
    obtenerMesasSala.mockResolvedValue(
      instantanea([{ id: 'mesa-1', identificador: 'Mesa 1', platos: [], completa: false }]),
    );

    const { result } = renderHook(() => useSala());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.mesas).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it('expone un error cuando falla la carga inicial', async () => {
    obtenerMesasSala.mockRejectedValue(new Error('Fallo de red'));

    const { result } = renderHook(() => useSala());

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  it('actualiza el estado de un plato al recibir linea.actualizada sin recargar', async () => {
    obtenerMesasSala.mockResolvedValue(
      instantanea([
        {
          id: 'mesa-1',
          identificador: 'Mesa 1',
          completa: false,
          aviso: null,
          platos: [
            { id: 'linea-1', nombre: 'Croquetas', cantidad: 1, partida: 'entrantes', estado: 'pendiente' },
          ],
        },
      ]),
    );
    const getManejador = capturarSuscripcion();

    const { result } = renderHook(() => useSala());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      getManejador().onEvento('linea.actualizada', {
        pedidoId: 'pedido-1',
        lineaId: 'linea-1',
        estado: 'listo',
      });
    });

    expect(result.current.mesas[0].platos[0].estado).toBe('listo');
  });

  it('refresca la instantánea al recibir aviso.activo', async () => {
    obtenerMesasSala.mockResolvedValue(instantanea([]));
    const getManejador = capturarSuscripcion();

    const { result } = renderHook(() => useSala());
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(obtenerMesasSala).toHaveBeenCalledTimes(1);

    obtenerMesasSala.mockResolvedValue(
      instantanea([{ id: 'mesa-1', identificador: 'Mesa 1', completa: true, platos: [] }]),
    );

    await act(async () => {
      getManejador().onEvento('aviso.activo', { aviso_id: 'aviso-1', mesa_id: 'mesa-1' });
    });

    await waitFor(() => expect(result.current.mesas).toHaveLength(1));
  });

  it('marca sin conexión cuando el canal SSE informa de error', async () => {
    obtenerMesasSala.mockResolvedValue(instantanea([]));
    const getManejador = capturarSuscripcion();

    const { result } = renderHook(() => useSala());
    await waitFor(() => expect(result.current.cargando).toBe(false));

    act(() => {
      getManejador().onEstadoConexion('sin-conexion');
    });

    expect(result.current.sinConexion).toBe(true);
  });
});
