import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../src/App.jsx';
import { tema } from '../src/theme/index.js';
import { ProveedorSesion, USUARIO_ADMIN, USUARIO_CAMARERO } from './helpers/auth.jsx';

function renderizar(ruta = '/', usuario = USUARIO_CAMARERO) {
  return render(
    <ChakraProvider theme={tema}>
      <ProveedorSesion usuario={usuario}>
        <MemoryRouter initialEntries={[ruta]}>
          <App />
        </MemoryRouter>
      </ProveedorSesion>
    </ChakraProvider>,
  );
}

describe('App', () => {
  it('muestra la cabecera y la navegación principal', () => {
    renderizar();

    expect(screen.getByRole('heading', { name: 'Foodware' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sala' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Señales' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cuentas' })).toBeInTheDocument();
  });

  it('muestra una página provisional en los módulos aún no implementados', () => {
    renderizar('/admin', USUARIO_ADMIN);

    expect(screen.getByRole('heading', { name: /gestión de la carta/i })).toBeInTheDocument();
  });});
