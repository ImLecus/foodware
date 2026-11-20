import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LineaPlato from '../../src/components/LineaPlato.jsx';
import TiempoEspera from '../../src/components/TiempoEspera.jsx';

function renderizar(ui) {
  return render(<ChakraProvider>{ui}</ChakraProvider>);
}

describe('TiempoEspera', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T10:35:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra los minutos transcurridos desde el envío original', () => {
    renderizar(<TiempoEspera enviadoEn="2026-10-20T10:00:00.000Z" />);

    expect(screen.getByText('35 min')).toBeInTheDocument();
  });

  it('avanza con el reloj local', () => {
    renderizar(<TiempoEspera enviadoEn="2026-10-20T10:00:00.000Z" />);

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(screen.getByText('40 min')).toBeInTheDocument();
  });
});

describe('LineaPlato', () => {
  it('muestra el nombre del plato y su cantidad', () => {
    renderizar(
      <LineaPlato
        linea={{
          id: 'linea-1',
          nombrePlato: 'Croquetas',
          cantidad: 2,
          estado: 'pendiente',
          listoEn: null,
        }}
      />,
    );

    expect(screen.getByText(/Croquetas/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
  });
});
