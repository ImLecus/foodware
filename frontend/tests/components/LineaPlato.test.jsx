import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LineaPlato from '../../src/components/LineaPlato.jsx';

function renderizar(linea) {
  return render(
    <ChakraProvider>
      <LineaPlato linea={linea} />
    </ChakraProvider>,
  );
}

describe('LineaPlato: distinción accesible', () => {
  it('marca un plato listo con color y etiqueta de texto, nunca solo color', () => {
    renderizar({
      id: 'linea-1',
      nombrePlato: 'Croquetas',
      cantidad: 2,
      estado: 'listo',
      listoEn: '2026-10-20T10:05:00.000Z',
    });

    expect(screen.getByText(/listo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/listo/i)).toBeInTheDocument();
  });

  it('marca un plato pendiente con su etiqueta de texto', () => {
    renderizar({
      id: 'linea-2',
      nombrePlato: 'Ensalada',
      cantidad: 1,
      estado: 'pendiente',
      listoEn: null,
    });

    expect(screen.getByText(/pendiente/i)).toBeInTheDocument();
  });
});
