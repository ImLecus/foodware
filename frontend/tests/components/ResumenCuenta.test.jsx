import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResumenCuenta from '../../src/components/ResumenCuenta.jsx';

const cuenta = {
  mesa_id: 'mesa-1',
  identificador: 'Mesa 1',
  estado: 'abierta',
  total_centimos: 4250,
  consumos: [
    {
      linea_id: 'linea-1',
      pedido_id: 'pedido-1',
      nombre: 'Ensaladilla',
      cantidad: 2,
      partida: 'entrantes',
      precio_centimos: 850,
      importe_centimos: 1700,
    },
    {
      linea_id: 'linea-2',
      pedido_id: 'pedido-1',
      nombre: 'Solomillo',
      cantidad: 1,
      partida: 'principales',
      precio_centimos: 2550,
      importe_centimos: 2550,
    },
  ],
  division: null,
  ticket_estado: 'no_emitido',
};

function renderizar(props) {
  return render(
    <ChakraProvider>
      <ResumenCuenta {...props} />
    </ChakraProvider>,
  );
}

describe('ResumenCuenta', () => {
  it('muestra los consumos y el total en euros con formato español', () => {
    renderizar({ cuenta });

    expect(screen.getByText('Ensaladilla')).toBeInTheDocument();
    expect(screen.getByText('Solomillo')).toBeInTheDocument();
    expect(screen.getByText(/42,50/)).toBeInTheDocument();
    expect(screen.getByText(/17,00/)).toBeInTheDocument();
  });

  it('muestra el estado de carga', () => {
    renderizar({ cargando: true });

    expect(screen.getByText(/cargando la cuenta/i)).toBeInTheDocument();
  });

  it('muestra el mensaje de vacío y el total a cero', () => {
    renderizar({ cuenta: { ...cuenta, consumos: [], total_centimos: 0 } });

    expect(screen.getByText(/no tiene consumos/i)).toBeInTheDocument();
    expect(screen.getByText(/0,00/)).toBeInTheDocument();
  });
});
