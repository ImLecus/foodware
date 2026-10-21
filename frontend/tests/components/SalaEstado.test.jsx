import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SalaEstado from '../../src/pages/SalaEstado.jsx';
import { obtenerMesasSala } from '../../src/services/api.js';

vi.mock('../../src/services/api.js', () => ({
  obtenerMesasSala: vi.fn(),
}));

vi.mock('../../src/hooks/useSala.js', () => ({
  useSala: vi.fn(),
}));

import { useSala } from '../../src/hooks/useSala.js';

function renderizar() {
  return render(
    <ChakraProvider>
      <SalaEstado />
    </ChakraProvider>,
  );
}

describe('SalaEstado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('distingue visualmente los platos listos de los pendientes', () => {
    useSala.mockReturnValue({
      mesas: [
        {
          id: 'mesa-1',
          identificador: 'Mesa 1',
          abierta: true,
          completa: false,
          aviso: null,
          platos: [
            { id: 'l1', nombre: 'Croquetas', cantidad: 1, partida: 'entrantes', estado: 'listo' },
            {
              id: 'l2',
              nombre: 'Paella',
              cantidad: 1,
              partida: 'principales',
              estado: 'pendiente',
            },
          ],
        },
      ],
      cargando: false,
      error: null,
      sinConexion: false,
      descartarAviso: vi.fn(),
    });

    renderizar();

    expect(screen.getByText('Mesa 1')).toBeInTheDocument();
    expect(screen.getByText('Croquetas')).toBeInTheDocument();
    expect(screen.getByText('Listo')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('muestra un estado vacío cuando no hay mesas abiertas', () => {
    useSala.mockReturnValue({
      mesas: [],
      cargando: false,
      error: null,
      sinConexion: false,
      descartarAviso: vi.fn(),
    });

    renderizar();

    expect(screen.getByText('No hay mesas abiertas')).toBeInTheDocument();
  });

  it('muestra un indicador de carga mientras llegan los datos', () => {
    useSala.mockReturnValue({
      mesas: [],
      cargando: true,
      error: null,
      sinConexion: false,
      descartarAviso: vi.fn(),
    });

    renderizar();

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('muestra el indicador de sin conexión', () => {
    useSala.mockReturnValue({
      mesas: [],
      cargando: false,
      error: null,
      sinConexion: true,
      descartarAviso: vi.fn(),
    });

    renderizar();

    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
  });
});
