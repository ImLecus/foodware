import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ParteCuenta from '../../src/components/ParteCuenta.jsx';

const pendiente = {
  id: 'parte-1',
  orden: 1,
  comensal: 'Ana',
  importe_centimos: 1625,
  estado: 'pendiente',
  pagada_en: null,
};

const pagada = {
  ...pendiente,
  estado: 'pagada',
  pagada_en: '2026-10-20T21:00:00.000Z',
};

function renderizar(props = {}) {
  return render(
    <ChakraProvider>
      <ParteCuenta parte={pendiente} onPagar={vi.fn()} onDeshacer={vi.fn()} {...props} />
    </ChakraProvider>,
  );
}

describe('ParteCuenta (US3)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra una parte pendiente y permite marcarla como pagada', () => {
    const onPagar = vi.fn();
    renderizar({ onPagar });

    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar como pagada' }));

    expect(onPagar).toHaveBeenCalledTimes(1);
  });

  it('deshace el pago de una parte pagada solo tras confirmarlo', () => {
    const onDeshacer = vi.fn();
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { rerender } = renderizar({ parte: pagada, onDeshacer });

    expect(screen.getByText('Pagada')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer pago' }));
    expect(onDeshacer).not.toHaveBeenCalled();

    confirmar.mockReturnValue(true);
    rerender(
      <ChakraProvider>
        <ParteCuenta parte={pagada} onDeshacer={onDeshacer} />
      </ChakraProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer pago' }));
    expect(onDeshacer).toHaveBeenCalledTimes(1);
  });

  it('no permite pagar ni deshacer con la mesa cerrada o mientras se guarda', () => {
    const { rerender } = renderizar({ deshabilitado: true });
    expect(screen.getByRole('button', { name: 'Marcar como pagada' })).toBeDisabled();

    rerender(
      <ChakraProvider>
        <ParteCuenta parte={pendiente} onPagar={vi.fn()} pagando deshabilitado />
      </ChakraProvider>,
    );
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
  });

  it('muestra el comensal como texto cuando la parte ya está confirmada', () => {
    renderizar({ parte: pagada, editable: false });

    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.queryByLabelText('Comensal de la parte 1')).not.toBeInTheDocument();
  });
});
