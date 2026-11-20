import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SalaEstado from '../../src/pages/SalaEstado.jsx';
import { descartarAvisoSala, obtenerMesasSala } from '../../src/services/api.js';

vi.mock('../../src/services/api.js', () => ({
  obtenerMesasSala: vi.fn(),
  descartarAvisoSala: vi.fn(),
}));

const { conexiones } = vi.hoisted(() => ({ conexiones: [] }));

vi.mock('../../src/services/realtime.js', () => ({
  suscribirASala: vi.fn(({ onEvento, onEstadoConexion } = {}) => {
    conexiones.push({ onEvento, onEstadoConexion });
    return () => {};
  }),
}));

const AVISO = {
  id: 'aviso-1',
  mesa_id: 'mesa-1',
  estado: 'activo',
  generado_en: '2026-10-27T09:00:00.000Z',
};

const instantanea = {
  generado_en: '2026-10-27T09:00:01.000Z',
  mesas: [
    {
      id: 'mesa-1',
      identificador: 'Mesa 1',
      abierta: true,
      completa: true,
      aviso: AVISO,
      platos: [
        { id: 'linea-1', nombre: 'Croquetas', cantidad: 1, partida: 'entrantes', estado: 'listo' },
      ],
    },
  ],
};

function renderizarDosPantallas() {
  return render(
    <ChakraProvider>
      <SalaEstado />
      <SalaEstado />
    </ChakraProvider>,
  );
}

describe('descarte global del aviso en dos pantallas', () => {
  beforeEach(() => {
    conexiones.length = 0;
    vi.clearAllMocks();
    obtenerMesasSala.mockResolvedValue(instantanea);
    descartarAvisoSala.mockResolvedValue({
      aviso_id: 'aviso-1',
      mesa_id: 'mesa-1',
      estado: 'descartado',
      descartado_en: '2026-10-27T09:01:00.000Z',
    });
  });

  it('una pantalla descarta y el aviso desaparece en ambas', async () => {
    renderizarDosPantallas();

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));
    expect(conexiones).toHaveLength(2);

    const [primerBoton] = screen.getAllByRole('button', { name: 'Descartar aviso' });

    await act(async () => {
      fireEvent.click(primerBoton);
    });

    await waitFor(() => expect(descartarAvisoSala).toHaveBeenCalledWith('aviso-1'));
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(1));

    act(() => {
      for (const { onEvento } of conexiones) {
        onEvento('aviso.descartado', {
          aviso_id: 'aviso-1',
          mesa_id: 'mesa-1',
          descartado_en: '2026-10-27T09:01:00.000Z',
        });
      }
    });

    await waitFor(() => expect(screen.queryAllByRole('alert')).toHaveLength(0));
    expect(screen.getAllByText('Mesa 1')).toHaveLength(2);
  });

  it('el aviso descartado no reaparece al resincronizar tras reconectar', async () => {
    renderizarDosPantallas();

    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2));

    obtenerMesasSala.mockResolvedValue({
      generado_en: '2026-10-27T09:02:00.000Z',
      mesas: [{ ...instantanea.mesas[0], aviso: null }],
    });

    await act(async () => {
      for (const { onEstadoConexion } of conexiones) {
        onEstadoConexion('conectado');
      }
    });

    await waitFor(() => expect(screen.queryAllByRole('alert')).toHaveLength(0));
    expect(screen.getAllByText('Mesa 1')).toHaveLength(2);
  });
});
