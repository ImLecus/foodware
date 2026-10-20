import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CocinaPage from '../../src/pages/CocinaPage.jsx';
import { obtenerCocinero, obtenerPedidosPendientes } from '../../src/services/api.js';

vi.mock('../../src/services/api.js', () => ({
  obtenerCocinero: vi.fn(),
  obtenerPedidosPendientes: vi.fn(),
}));

vi.mock('../../src/services/events.js', () => ({
  EVENTOS_COCINA: [
    'pedido.nuevo',
    'pedido.pendientes-cambiado',
    'linea.actualizada',
    'pedido.modificado',
  ],
  suscribirAPartida: vi.fn(() => () => {}),
}));

function renderizar() {
  return render(
    <ChakraProvider>
      <CocinaPage cocineroId="cocinero-entrantes" />
    </ChakraProvider>,
  );
}

const pedido = {
  id: 'pedido-1',
  mesa: 1,
  partida: 'entrantes',
  enviadoEn: '2026-10-20T09:00:00.000Z',
  modificado: false,
  estado: 'pendiente',
  lineas: [
    { id: 'linea-1', nombrePlato: 'Croquetas', cantidad: 2, estado: 'pendiente', listoEn: null },
  ],
};

describe('CocinaPage (US1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra solo los pedidos pendientes devueltos para la partida', async () => {
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
    obtenerPedidosPendientes.mockResolvedValue([pedido]);

    renderizar();

    expect(await screen.findByText('Mesa 1')).toBeInTheDocument();
    expect(screen.getByText(/Croquetas/)).toBeInTheDocument();
    expect(obtenerPedidosPendientes).toHaveBeenCalledWith('entrantes');
    expect(screen.queryByText('No hay pedidos pendientes')).not.toBeInTheDocument();
  });

  it('muestra el estado vacío cuando la partida no tiene pedidos', async () => {
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
    obtenerPedidosPendientes.mockResolvedValue([]);

    renderizar();

    expect(await screen.findByText('No hay pedidos pendientes')).toBeInTheDocument();
  });

  it('muestra el estado sin partida y no pide pedidos', async () => {
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-sin-partida',
      nombre: 'Sin partida',
      partida: null,
    });

    renderizar();

    expect(await screen.findByText('No tienes una partida asignada')).toBeInTheDocument();
    expect(obtenerPedidosPendientes).not.toHaveBeenCalled();
  });
});
