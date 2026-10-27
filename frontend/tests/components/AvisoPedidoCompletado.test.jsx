import { ChakraProvider } from '@chakra-ui/react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AvisoPedidoCompletado from '../../src/components/AvisoPedidoCompletado.jsx';

function renderizar(props = {}) {
  return render(
    <ChakraProvider>
      <AvisoPedidoCompletado
        pedidoId="pedido-1"
        lineaId="linea-1"
        onDeshacer={() => {}}
        {...props}
      />
    </ChakraProvider>,
  );
}

describe('AvisoPedidoCompletado', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el aviso con la acción Deshacer', () => {
    renderizar();

    expect(screen.getByText('Pedido completado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeInTheDocument();
  });

  it('permanece visible al menos 10 segundos', () => {
    renderizar();

    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(screen.getByText('Pedido completado')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Pedido completado')).not.toBeInTheDocument();
  });

  it('llama a deshacer con el pedido y la línea', () => {
    const onDeshacer = vi.fn();
    renderizar({ onDeshacer });

    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));

    expect(onDeshacer).toHaveBeenCalledWith({ pedidoId: 'pedido-1', lineaId: 'linea-1' });
  });
});
