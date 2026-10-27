import { ChakraProvider, Text } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import Pedido from '../src/components/Pedido.jsx';
import { tema } from '../src/theme/index.js';

const linea = {
  id: 'linea-1',
  plato_id: 'plato-entrante',
  plato_nombre: 'Croquetas de jamón',
  cantidad: 1,
  precio_centimos: 850,
  partida: 'entrantes',
};

const pedidoInicial = {
  id: 'pedido-1',
  mesa_id: 'mesa-1',
  estado: 'en_curso',
  lineas: [linea],
  por_partida: { entrantes: [linea], principales: [], postres: [] },
};

const mesa = { id: 'mesa-1', identificador: 'Mesa 1' };

/** Simula la pantalla de sala: al anular, el pedido desaparece y la mesa queda libre. */
function SalaDePrueba() {
  const [pedido, setPedido] = useState(pedidoInicial);

  if (!pedido) {
    return <Text>La mesa vuelve a estar libre</Text>;
  }

  return (
    <Pedido
      pedido={pedido}
      mesa={mesa}
      enLinea
      onCambiarCantidad={() => {}}
      onRetirarLinea={() => {}}
      onConfirmar={() => {}}
      onAnular={() => setPedido(null)}
    />
  );
}

function renderizarSala() {
  return render(
    <ChakraProvider theme={tema}>
      <SalaDePrueba />
    </ChakraProvider>,
  );
}

describe('Anular pedido', () => {
  it('pide confirmación antes de anular', async () => {
    renderizarSala();

    fireEvent.click(screen.getByRole('button', { name: 'Anular pedido' }));

    expect(await screen.findByText(/¿Seguro que quieres anular el pedido/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sí, anular pedido' })).toBeInTheDocument();
  });

  it('cancela la anulación sin tocar el pedido', async () => {
    renderizarSala();

    fireEvent.click(screen.getByRole('button', { name: 'Anular pedido' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByText(/¿Seguro que quieres anular el pedido/)).not.toBeInTheDocument();
    });
    expect(screen.getByText('Croquetas de jamón')).toBeInTheDocument();
  });

  it('anula el pedido y deja la mesa libre', async () => {
    renderizarSala();

    fireEvent.click(screen.getByRole('button', { name: 'Anular pedido' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Sí, anular pedido' }));

    expect(await screen.findByText('La mesa vuelve a estar libre')).toBeInTheDocument();
  });

  it('no ofrece anular un pedido ya enviado', () => {
    render(
      <ChakraProvider theme={tema}>
        <Pedido
          pedido={{ ...pedidoInicial, estado: 'enviada' }}
          mesa={mesa}
          enLinea
          onCambiarCantidad={() => {}}
          onRetirarLinea={() => {}}
          onConfirmar={() => {}}
          onAnular={() => {}}
        />
      </ChakraProvider>,
    );

    expect(screen.getByRole('button', { name: 'Anular pedido' })).toBeDisabled();
  });
});
