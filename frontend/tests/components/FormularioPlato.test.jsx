import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { describe, expect, it } from 'vitest';
import FormularioPlato from '../../src/components/FormularioPlato.jsx';

function renderizar(ui) {
  return render(<ChakraProvider>{ui}</ChakraProvider>);
}

describe('FormularioPlato', () => {
  it('muestra campos nombre, partida y precio', () => {
    renderizar(<FormularioPlato onSubmit={() => {}} onCancelar={() => {}} />);
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/partida/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/precio/i)).toBeInTheDocument();
  });
});
