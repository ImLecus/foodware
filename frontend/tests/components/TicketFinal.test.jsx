import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TicketFinal from '../../src/components/TicketFinal.jsx';

const ticket = {
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

function renderizar(props = {}) {
  return render(
    <ChakraProvider>
      <TicketFinal ticket={null} ticketEstado="no_emitido" hayDivision {...props} />
    </ChakraProvider>,
  );
}

describe('TicketFinal', () => {
  it('muestra el total y el desglose de cada parte del ticket', () => {
    renderizar({ ticket, ticketEstado: 'emitido' });

    expect(screen.getByRole('heading', { name: 'Ticket final' })).toBeInTheDocument();
    expect(screen.getByText('Mesa 1')).toBeInTheDocument();
    expect(screen.getAllByText(/21,25/)).toHaveLength(2);
    expect(screen.getByText(/Ana/)).toBeInTheDocument();
    expect(screen.getByText(/Luis/)).toBeInTheDocument();
  });

  it('avisa de que no hay ticket hasta pagar la última parte', () => {
    renderizar();

    expect(
      screen.getByText(/no se emitirá el ticket hasta pagar la última parte/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ticket final' })).not.toBeInTheDocument();
  });

  it('no muestra nada si la cuenta no tiene división ni ticket', () => {
    renderizar({ hayDivision: false });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ticket-final')).not.toBeInTheDocument();
  });
});
