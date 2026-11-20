import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CierreCuenta from '../../src/pages/CierreCuenta.jsx';
import { listarMesas, obtenerCuenta, pagarParte } from '../../src/services/api.js';

vi.mock('../../src/services/api.js', () => ({
  cerrarCuentaUnica: vi.fn(),
  dividirCuenta: vi.fn(),
  listarMesas: vi.fn(),
  obtenerCuenta: vi.fn(),
  obtenerTicket: vi.fn(),
  pagarParte: vi.fn(),
  deshacerPagoParte: vi.fn(),
}));

vi.mock('../../src/services/realtime.js', () => ({
  suscribirASala: vi.fn(() => () => {}),
}));

const cuentaDividida = {
  mesa_id: 'mesa-1',
  identificador: 'Mesa 1',
  estado: 'abierta',
  total_centimos: 4250,
  ticket_estado: 'no_emitido',
  consumos: [],
  division: {
    modo: 'iguales',
    partes: [
      {
        id: 'parte-1',
        orden: 1,
        comensal: 'Ana',
        importe_centimos: 2125,
        estado: 'pendiente',
        pagada_en: null,
      },
      {
        id: 'parte-2',
        orden: 2,
        comensal: 'Luis',
        importe_centimos: 2125,
        estado: 'pendiente',
        pagada_en: null,
      },
    ],
    asignaciones: [],
  },
};

const ticketFinal = {
  estado: 'emitido',
  mesa_id: 'mesa-1',
  identificador: 'Mesa 1',
  total_centimos: 4250,
  generado_en: '2026-10-20T21:05:00.000Z',
  partes: [
    { orden: 1, comensal: 'Ana', importe_centimos: 2125 },
    { orden: 2, comensal: 'Luis', importe_centimos: 2125 },
  ],
};

function renderizar() {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/cuentas?mesa=mesa-1']}>
        <CierreCuenta />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe('Cierre de cuenta con pago por partes (US3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarMesas.mockResolvedValue([{ id: 'mesa-1', identificador: 'Mesa 1', estado: 'abierta' }]);
    obtenerCuenta.mockResolvedValue(cuentaDividida);
  });

  it('cobra las partes una a una y muestra el ticket único al pagar la última', async () => {
    pagarParte
      .mockResolvedValueOnce({
        parte: { ...cuentaDividida.division.partes[0], estado: 'pagada', pagada_en: '2026-10-20T21:00:00.000Z' },
        ticket_estado: 'no_emitido',
        ticket: null,
        mesa_abierta: true,
      })
      .mockResolvedValueOnce({
        parte: { ...cuentaDividida.division.partes[1], estado: 'pagada', pagada_en: '2026-10-20T21:05:00.000Z' },
        ticket_estado: 'emitido',
        ticket: ticketFinal,
        mesa_abierta: false,
      });

    renderizar();

    expect(await screen.findByText('Ana')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar cobro único' })).not.toBeInTheDocument();
    expect(
      screen.getByText(/no se emitirá el ticket hasta pagar la última parte/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Marcar como pagada' })[0]);

    await waitFor(() => expect(pagarParte).toHaveBeenCalledWith('mesa-1', 'parte-1'));
    expect(await screen.findByText('Pagada')).toBeInTheDocument();
    expect(
      screen.getByText(/no se emitirá el ticket hasta pagar la última parte/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como pagada' }));

    await waitFor(() => expect(pagarParte).toHaveBeenCalledWith('mesa-1', 'parte-2'));
    expect(await screen.findByRole('heading', { name: 'Ticket final' })).toBeInTheDocument();
    expect(within(screen.getByTestId('ticket-final')).getAllByText(/21,25/)).toHaveLength(2);
    expect(screen.queryByText(/no se emitirá el ticket/i)).not.toBeInTheDocument();
  });

  it('recarga la cuenta y descarta la división si el pago detecta un total desactualizado', async () => {
    obtenerCuenta
      .mockResolvedValueOnce(cuentaDividida)
      .mockResolvedValueOnce({
        ...cuentaDividida,
        total_centimos: 4850,
        division: null,
      });

    const error = new Error(
      'El total de la cuenta ha cambiado: hay que rehacer la división',
    );
    error.status = 422;
    error.codigo = 'total_desactualizado';
    pagarParte.mockRejectedValue(error);

    renderizar();

    const botones = await screen.findAllByRole('button', { name: 'Marcar como pagada' });
    fireEvent.click(botones[0]);

    await waitFor(() => expect(obtenerCuenta).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText(/hay que rehacer la división/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Dividir la cuenta')).toBeInTheDocument();
    expect(screen.queryByText('Ana')).not.toBeInTheDocument();
  });
});
