import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('CocinaPage: carga inicial y error', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el indicador de carga y nunca el estado vacío antes de tener datos', () => {
    obtenerCocinero.mockReturnValue(new Promise(() => {}));

    renderizar();

    expect(screen.getByText('Cargando pedidos…')).toBeInTheDocument();
    expect(screen.queryByText('No hay pedidos pendientes')).not.toBeInTheDocument();
  });

  it('muestra el error con Reintentar y no el estado vacío', async () => {
    obtenerCocinero.mockRejectedValue(new Error('fallo de red'));

    renderizar();

    expect(await screen.findByText('No se pudieron cargar los pedidos')).toBeInTheDocument();
    expect(screen.queryByText('No hay pedidos pendientes')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(obtenerCocinero).toHaveBeenCalledTimes(2));
  });

  it('reintenta la carga correctamente tras un error', async () => {
    obtenerCocinero
      .mockRejectedValueOnce(new Error('fallo de red'))
      .mockResolvedValueOnce({ id: 'cocinero-entrantes', nombre: 'Marta', partida: 'entrantes' });
    obtenerPedidosPendientes.mockResolvedValue([]);

    renderizar();

    await screen.findByText('No se pudieron cargar los pedidos');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('No hay pedidos pendientes')).toBeInTheDocument();
  });
});
