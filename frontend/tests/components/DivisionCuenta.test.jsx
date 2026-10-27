import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DivisionCuenta from '../../src/components/DivisionCuenta.jsx';

const cuenta = {
  mesa_id: 'mesa-1',
  identificador: 'Mesa 1',
  total_centimos: 4250,
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

function renderizar(props = {}) {
  return render(
    <ChakraProvider>
      <DivisionCuenta cuenta={cuenta} onConfirmar={vi.fn()} {...props} />
    </ChakraProvider>,
  );
}

describe('DivisionCuenta', () => {
  it('reparte en partes iguales al céntimo y muestra la suma', () => {
    renderizar();

    expect(screen.getAllByText(/21,25/)).toHaveLength(2);
    expect(screen.getByText(/suma de las partes/i)).toHaveTextContent(/42,50/);

    fireEvent.change(screen.getByLabelText(/número de partes/i), { target: { value: '3' } });

    expect(screen.getAllByText(/14,17/)).toHaveLength(2);
    expect(screen.getByText(/14,16/)).toBeInTheDocument();
    expect(screen.getByText(/suma de las partes/i)).toHaveTextContent(/42,50/);
  });

  it('permite dividir por consumo y repartir un plato entre varias partes', () => {
    renderizar();

    fireEvent.click(screen.getByRole('button', { name: 'Por consumo' }));

    expect(screen.getByText('Ensaladilla')).toBeInTheDocument();
    expect(screen.getByText('Solomillo')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/asignar ensaladilla a la parte 2/i));

    expect(screen.getByText(/34,00/)).toBeInTheDocument();
    expect(screen.getAllByText(/8,50/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/suma de las partes/i)).toHaveTextContent(/42,50/);
  });
});
