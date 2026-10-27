import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSala } from '../../src/hooks/useSala.js';
import { obtenerMesasSala } from '../../src/services/api.js';
import { suscribirASala } from '../../src/services/realtime.js';
import { guardarSilenciado, leerSilenciado, reproducirPitido } from '../../src/utils/sonido.js';

vi.mock('../../src/services/api.js', () => ({
  obtenerMesasSala: vi.fn(),
}));

vi.mock('../../src/services/realtime.js', () => ({
  suscribirASala: vi.fn(() => () => {}),
}));

vi.mock('../../src/utils/sonido.js', () => ({
  leerSilenciado: vi.fn(() => false),
  guardarSilenciado: vi.fn(),
  reproducirPitido: vi.fn(),
}));

const instantanea = (mesas = []) => ({ generado_en: '2026-10-27T09:00:00.000Z', mesas });

/** Captura el manejador de eventos que la vista registra en el canal de sala. */
function capturarSuscripcion() {
  let manejador;
  suscribirASala.mockImplementation(({ onEvento, onEstadoConexion } = {}) => {
    manejador = { onEvento, onEstadoConexion };
    return () => {};
  });
  return () => manejador;
}

async function montarSala() {
  const getManejador = capturarSuscripcion();
  const { result } = renderHook(() => useSala());
  await waitFor(() => expect(result.current.cargando).toBe(false));
  return { result, getManejador };
}

describe('señal sonora de los avisos de mesa completa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    leerSilenciado.mockReturnValue(false);
    obtenerMesasSala.mockResolvedValue(instantanea());
  });

  it('está activada por defecto', async () => {
    const { result } = await montarSala();

    expect(result.current.silenciado).toBe(false);
    expect(leerSilenciado).toHaveBeenCalled();
  });

  it('suena una sola vez por aviso aunque llegue repetido', async () => {
    const { result, getManejador } = await montarSala();

    act(() => {
      getManejador().onEvento('aviso.activo', { aviso_id: 'aviso-1', mesa_id: 'mesa-1' });
      getManejador().onEvento('aviso.activo', { aviso_id: 'aviso-1', mesa_id: 'mesa-1' });
    });

    expect(reproducirPitido).toHaveBeenCalledTimes(1);

    act(() => {
      getManejador().onEvento('aviso.activo', { aviso_id: 'aviso-2', mesa_id: 'mesa-2' });
    });

    expect(reproducirPitido).toHaveBeenCalledTimes(2);
    expect(result.current.mesas).toEqual([]);
  });

  it('no suena si el dispositivo arranca silenciado', async () => {
    leerSilenciado.mockReturnValue(true);
    const { result, getManejador } = await montarSala();

    expect(result.current.silenciado).toBe(true);

    act(() => {
      getManejador().onEvento('aviso.activo', { aviso_id: 'aviso-1', mesa_id: 'mesa-1' });
    });

    expect(reproducirPitido).not.toHaveBeenCalled();
  });

  it('silencia, reactiva y persiste la preferencia', async () => {
    const { result, getManejador } = await montarSala();

    act(() => {
      result.current.alternarSonido();
    });

    expect(result.current.silenciado).toBe(true);
    expect(guardarSilenciado).toHaveBeenLastCalledWith(true);

    act(() => {
      getManejador().onEvento('aviso.activo', { aviso_id: 'aviso-1', mesa_id: 'mesa-1' });
    });
    expect(reproducirPitido).not.toHaveBeenCalled();

    act(() => {
      result.current.alternarSonido();
    });

    expect(result.current.silenciado).toBe(false);
    expect(guardarSilenciado).toHaveBeenLastCalledWith(false);

    act(() => {
      getManejador().onEvento('aviso.activo', { aviso_id: 'aviso-2', mesa_id: 'mesa-2' });
    });
    expect(reproducirPitido).toHaveBeenCalledTimes(1);
  });

  it('guarda la preferencia de sonido en el almacenamiento local', async () => {
    const real = await vi.importActual('../../src/utils/sonido.js');

    real.guardarSilenciado(true);
    expect(real.leerSilenciado()).toBe(true);

    real.guardarSilenciado(false);
    expect(real.leerSilenciado()).toBe(false);
  });
});
