import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Mesas from '../../src/pages/Mesas.jsx';
import { listarMesas, listarPlatos } from '../../src/services/api.js';
import { EventSourceFalso } from '../ayuda/eventSourceFalso.js';

vi.mock('../../src/services/api.js', () => ({
  API_BASE: '/api',
  abrirMesa: vi.fn(),
  anadirLinea: vi.fn(),
  anularPedido: vi.fn(),
  confirmarPedido: vi.fn(),
  listarMesas: vi.fn(),
  listarPlatos: vi.fn(),
  modificarLinea: vi.fn(),
  obtenerPedido: vi.fn(),
  retirarLinea: vi.fn(),
}));

function renderizar() {
  return render(
    <ChakraProvider>
      <MemoryRouter>
        <Mesas />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe('Mesas (sala)', () => {
  const EventSourceOriginal = globalThis.EventSource;

  beforeEach(() => {
    vi.clearAllMocks();
    EventSourceFalso.instancias = [];
    globalThis.EventSource = EventSourceFalso;
  });

  afterEach(() => {
    globalThis.EventSource = EventSourceOriginal;
  });

  it('no muestra las mesas cerradas y mantiene las libres y ocupadas', async () => {
    listarMesas.mockResolvedValue([
      { id: 'mesa-1', identificador: 'Mesa 1', estado: 'ocupada', pedido_en_curso_id: null },
      { id: 'mesa-2', identificador: 'Mesa 2', estado: 'libre', pedido_en_curso_id: null },
      { id: 'mesa-3', identificador: 'Mesa 3', estado: 'cerrada', pedido_en_curso_id: null },
    ]);
    listarPlatos.mockResolvedValue([]);

    renderizar();

    expect(await screen.findByText('Mesa 1')).toBeInTheDocument();
    expect(screen.getByText('Mesa 2')).toBeInTheDocument();
    expect(screen.queryByText('Mesa 3')).not.toBeInTheDocument();
    expect(screen.getByText('Ocupada')).toBeInTheDocument();
    expect(screen.getByText('Libre')).toBeInTheDocument();
  });

  it('avisa de que no hay mesas cuando todas están cerradas', async () => {
    listarMesas.mockResolvedValue([
      { id: 'mesa-3', identificador: 'Mesa 3', estado: 'cerrada', pedido_en_curso_id: null },
    ]);
    listarPlatos.mockResolvedValue([]);

    renderizar();

    expect(await screen.findByText(/No hay mesas para mostrar/i)).toBeInTheDocument();
    expect(screen.queryByText('Mesa 3')).not.toBeInTheDocument();
  });

  it('recarga la lista y retira la mesa al recibir mesa-cerrada', async () => {
    const ocupada = {
      id: 'mesa-1',
      identificador: 'Mesa 1',
      estado: 'ocupada',
      pedido_en_curso_id: null,
    };
    const libre = {
      id: 'mesa-2',
      identificador: 'Mesa 2',
      estado: 'libre',
      pedido_en_curso_id: null,
    };
    listarMesas.mockResolvedValue([ocupada, libre]);
    listarPlatos.mockResolvedValue([]);

    renderizar();

    expect(await screen.findByText('Mesa 1')).toBeInTheDocument();
    const conexion = EventSourceFalso.instancias.at(-1);

    listarMesas.mockResolvedValue([libre]);
    await act(async () => {
      conexion.emitir('mesa-cerrada', { mesa_id: 'mesa-1', cuenta_id: 'cuenta-1' });
    });

    await waitFor(() => expect(screen.queryByText('Mesa 1')).not.toBeInTheDocument());
    expect(listarMesas).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Mesa 2')).toBeInTheDocument();
  });
});
