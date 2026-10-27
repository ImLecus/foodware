import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SalaPage from '../../src/pages/SalaPage.jsx';
import { obtenerEstadoPlatos } from '../../src/services/api.js';
import { suscribirSala } from '../../src/services/events.js';

vi.mock('../../src/services/api.js', () => ({
  obtenerEstadoPlatos: vi.fn(),
}));

vi.mock('../../src/services/events.js', () => ({
  suscribirSala: vi.fn(() => () => {}),
}));

function renderizar() {
  return render(
    <ChakraProvider>
      <SalaPage mesaId="mesa-1" numeroMesa={1} />
    </ChakraProvider>,
  );
}

const lineaPendiente = {
  id: 'linea-1',
  pedidoId: 'pedido-1',
  nombrePlato: 'Croquetas',
  cantidad: 2,
  estado: 'pendiente',
  listoEn: null,
};

describe('SalaPage (US2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra los platos de la mesa y su estado', async () => {
    obtenerEstadoPlatos.mockResolvedValue([lineaPendiente]);

    renderizar();

    expect(await screen.findByText('Mesa 1')).toBeInTheDocument();
    expect(screen.getByText(/Croquetas/)).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
  });

  it('muestra el error de carga en español', async () => {
    obtenerEstadoPlatos.mockRejectedValue(
      new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'),
    );

    renderizar();

    expect(
      await screen.findByText(
        'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
  });

  it('actualiza el estado al recibir un evento sin recargar', async () => {
    obtenerEstadoPlatos.mockResolvedValueOnce([lineaPendiente]);
    renderizar();
    await screen.findByText(/Croquetas/);
    await waitFor(() => expect(suscribirSala).toHaveBeenCalled());

    const opciones = suscribirSala.mock.calls.at(-1)[0];
    obtenerEstadoPlatos.mockResolvedValueOnce([
      { ...lineaPendiente, estado: 'listo', listoEn: '2026-10-20T10:05:00.000Z' },
    ]);

    await act(async () => {
      opciones.onEvento('linea.actualizada', { lineaId: 'linea-1' });
    });

    expect(await screen.findByText('listo')).toBeInTheDocument();
  });
});
