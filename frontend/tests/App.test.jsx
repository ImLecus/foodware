import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../src/App.jsx';
import { tema } from '../src/theme/index.js';

function renderizar(ruta = '/') {
  return render(
    <ChakraProvider theme={tema}>
      <MemoryRouter initialEntries={[ruta]}>
        <App />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe('App', () => {
  it('muestra la cabecera y la navegación principal', () => {
    renderizar();

    expect(screen.getByRole('heading', { name: 'Foodware' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sala' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cocina' })).toBeInTheDocument();
  });

  it('muestra una página provisional en los módulos aún no implementados', () => {
    renderizar('/dashboard');

    expect(screen.getByText('Módulo en construcción')).toBeInTheDocument();
  });
});
