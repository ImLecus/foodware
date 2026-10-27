import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CierreCuenta from '../../src/pages/CierreCuenta.jsx';
import {
  cerrarCuentaUnica,
  dividirCuenta,
  listarMesas,
  obtenerCuenta,
  obtenerTicket,
} from '../../src/services/api.js';
import { suscribirASala } from '../../src/services/realtime.js';

vi.mock('../../src/services/api.js', () => ({
  cerrarCuentaUnica: vi.fn(),
  dividirCuenta: vi.fn(),
  listarMesas: vi.fn(),
  obtenerCuenta: vi.fn(),
  obtenerTicket: vi.fn(),
}));

vi.mock('../../src/services/realtime.js', () => ({
  suscribirASala: vi.fn(() => () => {}),
}));

const cuenta = {
  mesa_id: 'mesa-1',
  identificador: 'Mesa 1',
  estado: 'abierta',
  total_centimos: 4250,
  ticket_estado: 'no_emitido',
  consumos: [
    {
      linea_id: 'linea-1',
      nombre: 'Ensaladilla',
      cantidad: 2,
      precio_centimos: 850,
      importe_centimos: 1700,
    },
    {
      linea_id: 'linea-2',
      nombre: 'Solomillo',
      cantidad: 1,
      precio_centimos: 2550,
      importe_centimos: 2550,
    },
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

/** Captura el manejador de estado que la cuenta registra en el canal de sala. */
function capturarConexion() {
  let manejador;
  suscribirASala.mockImplementation(({ onEstadoConexion } = {}) => {
    manejador = { onEstadoConexion };
    return () => {};
  });
  return () => manejador;
}

describe('CierreCuenta (US2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    suscribirASala.mockImplementation(() => () => {});
    listarMesas.mockResolvedValue([{ id: 'mesa-1', identificador: 'Mesa 1', estado: 'abierta' }]);
  });

  it('confirma el cobro único y muestra el ticket final', async () => {
    obtenerCuenta.mockResolvedValue(cuenta);
    cerrarCuentaUnica.mockResolvedValue({
      cuenta: { ...cuenta, estado: 'cerrada' },
      ticket_estado: 'emitido',
      ticket: {
        estado: 'emitido',
        mesa_id: 'mesa-1',
        identificador: 'Mesa 1',
        total_centimos: 4250,
        generado_en: '2026-10-27T21:00:00.000Z',
        partes: [],
      },
    });

    renderizar();

    const boton = await screen.findByRole('button', { name: 'Confirmar cobro único' });
    fireEvent.click(boton);

    await waitFor(() => expect(cerrarCuentaUnica).toHaveBeenCalledWith('mesa-1', 4250));
    expect(await screen.findByText(/cuenta cerrada y ticket emitido/i)).toBeInTheDocument();
    const ticket = await screen.findByTestId('ticket-final');
    expect(within(ticket).getAllByText('42,50 €')).toHaveLength(2);
    expect(within(ticket).getByText('Mesa 1')).toBeInTheDocument();
    expect(screen.queryByText('Dividir la cuenta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar cobro único' })).not.toBeInTheDocument();
    expect(dividirCuenta).not.toHaveBeenCalled();
  });

  it('recarga la cuenta si el cobro único detecta un total desactualizado', async () => {
    obtenerCuenta
      .mockResolvedValueOnce(cuenta)
      .mockResolvedValueOnce({ ...cuenta, total_centimos: 4850 });

    const error = new Error('El total de la cuenta ha cambiado: vuelve a revisarlo');
    error.status = 422;
    error.codigo = 'total_desactualizado';
    cerrarCuentaUnica.mockRejectedValue(error);

    renderizar();

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar cobro único' }));

    await waitFor(() => expect(obtenerCuenta).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText(/ha cambiado: vuelve a revisarlo/i)).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText('48,50 €').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('ticket-final')).not.toBeInTheDocument();
  });

  it('recarga la cuenta si la división detecta un total desactualizado', async () => {
    obtenerCuenta
      .mockResolvedValueOnce(cuenta)
      .mockResolvedValueOnce({ ...cuenta, total_centimos: 4850 });

    const error = new Error('El total de la cuenta ha cambiado: vuelve a revisarlo');
    error.status = 422;
    error.codigo = 'total_desactualizado';
    dividirCuenta.mockRejectedValue(error);

    renderizar();

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar división' }));

    await waitFor(() => expect(obtenerCuenta).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText(/ha cambiado: vuelve a revisarlo/i)).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText('Dividir la cuenta')).toBeInTheDocument();
  });

  it('divide la cuenta y sustituye el cobro único por el aviso de cuenta dividida', async () => {
    obtenerCuenta.mockResolvedValue(cuenta);
    dividirCuenta.mockResolvedValue({
      cuenta: { ...cuenta, modo_division: 'iguales' },
      division: {
        modo: 'iguales',
        partes: [
          { orden: 1, comensal: 'Comensal 1', importe_centimos: 2125, estado: 'pendiente' },
          { orden: 2, comensal: 'Comensal 2', importe_centimos: 2125, estado: 'pendiente' },
        ],
        asignaciones: [],
      },
    });

    renderizar();

    expect(await screen.findByText('Dividir la cuenta')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar división' }));

    await waitFor(() =>
      expect(dividirCuenta).toHaveBeenCalledWith(
        'mesa-1',
        expect.objectContaining({
          modo: 'iguales',
          total_base_centimos: 4250,
          partes: [
            { orden: 1, comensal: 'Comensal 1', importe_centimos: 2125 },
            { orden: 2, comensal: 'Comensal 2', importe_centimos: 2125 },
          ],
        }),
      ),
    );

    expect(
      await screen.findByText(/división confirmada\. ya puedes cobrar cada parte/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/cuenta dividida en 2 parte/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar cobro único' })).not.toBeInTheDocument();
    expect(cerrarCuentaUnica).not.toHaveBeenCalled();
  });

  it('muestra los platos pendientes y deshabilita el cierre', async () => {
    obtenerCuenta.mockResolvedValue({
      ...cuenta,
      platos_pendientes: [
        {
          linea_id: 'linea-2',
          nombre: 'Solomillo',
          partida: 'principales',
          estado: 'pendiente',
        },
      ],
    });

    renderizar();

    expect(await screen.findByText(/hay platos pendientes en cocina/i)).toBeInTheDocument();
    expect(screen.getByText(/Solomillo · principales/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar cobro único' })).toBeDisabled();
  });

  it('muestra el ticket final al abrir una mesa ya cerrada', async () => {
    const yaCerrada = new Error('La cuenta ya está cerrada');
    yaCerrada.status = 409;
    obtenerCuenta.mockRejectedValue(yaCerrada);
    obtenerTicket.mockResolvedValue({
      estado: 'emitido',
      mesa_id: 'mesa-1',
      identificador: 'Mesa 1',
      total_centimos: 4250,
      generado_en: '2026-10-27T21:00:00.000Z',
      partes: [
        { orden: 1, comensal: 'Ana', importe_centimos: 2125 },
        { orden: 2, comensal: 'Luis', importe_centimos: 2125 },
      ],
    });

    renderizar();

    const ticket = await screen.findByTestId('ticket-final');
    expect(obtenerTicket).toHaveBeenCalledWith('mesa-1');
    expect(within(ticket).getByText('Mesa 1')).toBeInTheDocument();
    expect(within(ticket).getAllByText('21,25 €')).toHaveLength(2);
    expect(within(ticket).getAllByText('42,50 €')).toHaveLength(2);
    expect(screen.getByText(/la cuenta ya está cerrada/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar cobro único' })).not.toBeInTheDocument();
    expect(screen.queryByText('La cuenta ya está cerrada')).not.toBeInTheDocument();
  });

  it('muestra el error si la mesa cerrada aún no tiene ticket emitido', async () => {
    const yaCerrada = new Error('La cuenta ya está cerrada');
    yaCerrada.status = 409;
    obtenerCuenta.mockRejectedValue(yaCerrada);

    const sinTicket = new Error('El ticket aún no se ha emitido');
    sinTicket.status = 409;
    sinTicket.codigo = 'ticket_no_emitido';
    obtenerTicket.mockRejectedValue(sinTicket);

    renderizar();

    expect(await screen.findByText(/el ticket aún no se ha emitido/i)).toBeInTheDocument();
    expect(screen.queryByTestId('ticket-final')).not.toBeInTheDocument();
  });

  it('no consulta el ticket cuando la cuenta sigue abierta', async () => {
    obtenerCuenta.mockResolvedValue(cuenta);

    renderizar();

    expect(await screen.findByText('Dividir la cuenta')).toBeInTheDocument();
    expect(obtenerTicket).not.toHaveBeenCalled();
  });

  it('avisa de que no hay conexión y bloquea el cobro', async () => {
    obtenerCuenta.mockRejectedValue(new Error('Failed to fetch'));

    renderizar();

    expect(
      await screen.findByText(/sin conexión\. no se puede confirmar el cierre/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar cobro único' })).toBeDisabled();
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument();
    expect(cerrarCuentaUnica).not.toHaveBeenCalled();
  });

  it('se recupera al reconectar y permite completar la división', async () => {
    obtenerCuenta.mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValue(cuenta);
    dividirCuenta.mockResolvedValue({
      cuenta: { ...cuenta, modo_division: 'iguales' },
      division: {
        modo: 'iguales',
        partes: [
          { orden: 1, comensal: 'Comensal 1', importe_centimos: 2125, estado: 'pendiente' },
          { orden: 2, comensal: 'Comensal 2', importe_centimos: 2125, estado: 'pendiente' },
        ],
        asignaciones: [],
      },
    });
    const getManejador = capturarConexion();

    renderizar();

    expect(await screen.findByText(/sin conexión\./i)).toBeInTheDocument();
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument();

    await act(async () => {
      getManejador().onEstadoConexion('conectado');
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar división' }));

    expect(
      await screen.findByText(/división confirmada\. ya puedes cobrar cada parte/i),
    ).toBeInTheDocument();
    expect(dividirCuenta).toHaveBeenCalledWith(
      'mesa-1',
      expect.objectContaining({ modo: 'iguales', total_base_centimos: 4250 }),
    );
  });

  it('conserva la división compuesta y permite reintentar el cobro tras un corte', async () => {
    obtenerCuenta.mockResolvedValue(cuenta);
    cerrarCuentaUnica.mockRejectedValueOnce(new Error('Failed to fetch')).mockResolvedValueOnce({
      cuenta: { ...cuenta, estado: 'cerrada' },
      ticket_estado: 'emitido',
      ticket: {
        estado: 'emitido',
        mesa_id: 'mesa-1',
        identificador: 'Mesa 1',
        total_centimos: 4250,
        generado_en: '2026-10-27T21:00:00.000Z',
        partes: [],
      },
    });

    renderizar();

    const comensal = await screen.findByLabelText('Comensal de la parte 1');
    fireEvent.change(comensal, { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cobro único' }));

    expect(await screen.findByText(/sin conexión\./i)).toBeInTheDocument();
    expect(screen.queryByText('Failed to fetch')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Comensal de la parte 1')).toHaveValue('Ana');

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(obtenerCuenta).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('button', { name: 'Confirmar cobro único' })).toBeEnabled();
    expect(screen.getByLabelText('Comensal de la parte 1')).toHaveValue('Ana');

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cobro único' }));

    expect(await screen.findByTestId('ticket-final')).toBeInTheDocument();
    expect(cerrarCuentaUnica).toHaveBeenCalledTimes(2);
  });
});
