import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CocinaPage from '../../src/pages/CocinaPage.jsx';
import { marcarEstado, obtenerCocinero, obtenerPedidosPendientes } from '../../src/services/api.js';
import { suscribirAPartida } from '../../src/services/events.js';

vi.mock('../../src/services/api.js', () => ({
  obtenerCocinero: vi.fn(),
  obtenerPedidosPendientes: vi.fn(),
  marcarEstado: vi.fn(),
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

  it('marca un plato como listo desde la cocina', async () => {
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
    obtenerPedidosPendientes.mockResolvedValue([pedido]);
    marcarEstado.mockResolvedValue({ id: 'linea-1', estado: 'listo', pedidoCompletado: false });

    renderizar();
    await screen.findByText('Mesa 1');

    fireEvent.click(screen.getByRole('button', { name: 'Marcar listo' }));

    await waitFor(() =>
      expect(marcarEstado).toHaveBeenCalledWith('pedido-1', 'linea-1', 'listo', 'entrantes'),
    );
  });

  it('deshace la marca de un plato listo', async () => {
    const pedidoConListo = {
      ...pedido,
      lineas: [{ ...pedido.lineas[0], estado: 'listo', listoEn: '2026-10-20T10:05:00.000Z' }],
    };
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
    obtenerPedidosPendientes.mockResolvedValue([pedidoConListo]);
    marcarEstado.mockResolvedValue({ id: 'linea-1', estado: 'pendiente', listoEn: null });

    renderizar();
    await screen.findByText('Mesa 1');

    expect(screen.getByLabelText(/listo/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));

    await waitFor(() =>
      expect(marcarEstado).toHaveBeenCalledWith('pedido-1', 'linea-1', 'pendiente', 'entrantes'),
    );
  });

  it('bloquea el marcado cuando no hay conexión', async () => {
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
    obtenerPedidosPendientes.mockResolvedValue([pedido]);

    renderizar();
    await screen.findByText('Mesa 1');
    await waitFor(() => expect(suscribirAPartida).toHaveBeenCalled());

    const opciones = suscribirAPartida.mock.calls.at(-1)[1];
    act(() => {
      opciones.onEstadoConexion('sin-conexion');
    });

    expect(await screen.findByText('Sin conexión')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Marcar listo' })).toBeDisabled();
  });

  it('muestra el aviso al completar la partida de un pedido mixto', async () => {
    const pedidoMixto = {
      ...pedido,
      lineas: [
        { ...pedido.lineas[0], id: 'linea-1', nombrePlato: 'Croquetas' },
        { ...pedido.lineas[0], id: 'linea-2', nombrePlato: 'Paella' },
      ],
    };
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
    obtenerPedidosPendientes
      .mockResolvedValueOnce([pedidoMixto])
      .mockResolvedValueOnce([]);
    marcarEstado.mockResolvedValue({
      id: 'linea-1',
      estado: 'listo',
      pedidoCompletado: true,
    });

    renderizar();
    await screen.findByText('Mesa 1');

    fireEvent.click(screen.getAllByRole('button', { name: 'Marcar listo' })[0]);

    expect(await screen.findByText('Pedido completado')).toBeInTheDocument();
  });

  it('ofrece Deshacer tras completar el pedido y revierte la última marca', async () => {
    obtenerCocinero.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      partida: 'entrantes',
    });
    obtenerPedidosPendientes
      .mockResolvedValueOnce([pedido])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([pedido]);
    marcarEstado
      .mockResolvedValueOnce({ id: 'linea-1', estado: 'listo', pedidoCompletado: true })
      .mockResolvedValueOnce({ id: 'linea-1', estado: 'pendiente', pedidoReabierto: true });

    renderizar();
    await screen.findByText('Mesa 1');

    fireEvent.click(screen.getByRole('button', { name: 'Marcar listo' }));

    expect(await screen.findByText('Pedido completado')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));

    await waitFor(() =>
      expect(marcarEstado).toHaveBeenLastCalledWith(
        'pedido-1',
        'linea-1',
        'pendiente',
        'entrantes',
      ),
    );
  });
});
