import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CocinaPage from '../../src/pages/CocinaPage.jsx';
import { obtenerPedidosPendientes } from '../../src/services/api.js';
import { ProveedorSesion, USUARIO_COCINERO } from '../helpers/auth.jsx';
import { suscribirAPartida } from '../../src/services/events.js';

vi.mock('../../src/services/api.js', () => ({
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

const pedido = (id, mesa) => ({
  id,
  mesa,
  partida: 'entrantes',
  enviadoEn: '2026-10-20T09:00:00.000Z',
  modificado: false,
  estado: 'pendiente',
  lineas: [
    {
      id: `linea-${id}`,
      nombrePlato: 'Croquetas',
      cantidad: 1,
      estado: 'pendiente',
      listoEn: null,
    },
  ],
});

function renderizar() {
  return render(
    <ChakraProvider>
      <ProveedorSesion usuario={USUARIO_COCINERO}>
        <CocinaPage />
      </ProveedorSesion>
    </ChakraProvider>,
  );
}

describe('CocinaPage en vivo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refresca la lista al recibir un evento sin recargar', async () => {
    obtenerPedidosPendientes.mockResolvedValueOnce([pedido('pedido-1', 1)]);
    renderizar();

    expect(await screen.findByText('Mesa 1')).toBeInTheDocument();
    await waitFor(() => expect(suscribirAPartida).toHaveBeenCalled());

    const opciones = suscribirAPartida.mock.calls[0][1];
    obtenerPedidosPendientes.mockResolvedValueOnce([pedido('pedido-1', 1), pedido('pedido-2', 2)]);

    await act(async () => {
      opciones.onEvento('pedido.nuevo', { pedidoId: 'pedido-2' });
    });

    expect(await screen.findByText('Mesa 2')).toBeInTheDocument();
  });

  it('muestra el indicador de sin conexión al perder el canal', async () => {
    obtenerPedidosPendientes.mockResolvedValue([pedido('pedido-1', 1)]);
    renderizar();
    await screen.findByText('Mesa 1');
    await waitFor(() => expect(suscribirAPartida).toHaveBeenCalled());

    const opciones = suscribirAPartida.mock.calls[0][1];

    act(() => {
      opciones.onEstadoConexion('sin-conexion');
    });

    expect(await screen.findByText('Sin conexión')).toBeInTheDocument();
  });
});
