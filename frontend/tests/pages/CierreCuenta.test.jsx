import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CierreCuenta from '../../src/pages/CierreCuenta.jsx';
import {
  cerrarCuentaUnica,
  dividirCuenta,
  listarMesas,
  obtenerCuenta,
} from '../../src/services/api.js';

vi.mock('../../src/services/api.js', () => ({
  cerrarCuentaUnica: vi.fn(),
  dividirCuenta: vi.fn(),
  listarMesas: vi.fn(),
  obtenerCuenta: vi.fn(),
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

describe('CierreCuenta (US2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarMesas.mockResolvedValue([{ id: 'mesa-1', identificador: 'Mesa 1', estado: 'abierta' }]);
  });

  it('confirma el cobro único cuando la cuenta no está dividida', async () => {
    obtenerCuenta.mockResolvedValue(cuenta);
    cerrarCuentaUnica.mockResolvedValue({
      cuenta: { ...cuenta, estado: 'cerrada' },
      ticket_estado: 'emitido',
      ticket: { total_centimos: 4250, partes: [{ comensal: null, importe_centimos: 4250 }] },
    });

    renderizar();

    const boton = await screen.findByRole('button', { name: 'Confirmar cobro único' });
    fireEvent.click(boton);

    await waitFor(() => expect(cerrarCuentaUnica).toHaveBeenCalledWith('mesa-1', 4250));
    expect(await screen.findByText(/cuenta cerrada y ticket emitido/i)).toBeInTheDocument();
    expect(screen.getByText(/ticket emitido con 1 parte/i)).toBeInTheDocument();
    expect(dividirCuenta).not.toHaveBeenCalled();
  });

  it('divide la cuenta y sustituye el cobro único por el aviso de cuenta dividida', async () => {    obtenerCuenta.mockResolvedValue(cuenta);
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
});
