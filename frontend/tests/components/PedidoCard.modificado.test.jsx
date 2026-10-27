import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PedidoCard from '../../src/components/PedidoCard.jsx';

const pedido = {
  id: 'pedido-editado',
  mesa: 3,
  partida: 'entrantes',
  enviadoEn: '2026-10-20T09:00:00.000Z',
  modificadoEn: '2026-10-20T10:30:00.000Z',
  modificado: true,
  estado: 'pendiente',
  lineas: [
    { id: 'linea-1', nombrePlato: 'Croquetas', cantidad: 2, estado: 'pendiente', listoEn: null },
  ],
};

describe('PedidoCard con pedido modificado', () => {
  it('muestra el aviso Modificado sin detallar qué líneas cambiaron', () => {
    render(
      <ChakraProvider>
        <PedidoCard pedido={pedido} />
      </ChakraProvider>,
    );

    expect(screen.getByText(/modificado/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/línea añadida|línea retirada|cantidad modificada/i),
    ).not.toBeInTheDocument();
  });
});
