import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../../src/App.jsx';
import { tema } from '../../src/theme/index.js';
import { vi } from 'vitest';
vi.mock('../../src/services/events.js', () => ({
  EVENTOS_COCINA: [],
  suscribirAPartida: vi.fn(() => () => {}),
  suscribirSala: vi.fn(() => () => {}),
}));

import {
  ProveedorSesion,
  USUARIO_ADMIN,
  USUARIO_CAMARERO,
  USUARIO_COCINERO,
  USUARIO_ENCARGADO,
} from '../helpers/auth.jsx';

function renderizar(usuario) {
  return render(
    <ChakraProvider theme={tema}>
      <ProveedorSesion usuario={usuario}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </ProveedorSesion>
    </ChakraProvider>,
  );
}

describe('Menú por rol', () => {
  it('el camarero ve sala, señales y cuentas', () => {
    renderizar(USUARIO_CAMARERO);

    expect(screen.getByRole('link', { name: 'Sala' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Señales' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Cuentas' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Cocina' })).not.toBeInTheDocument();
  });

  it('el cocinero solo ve cocina', () => {
    renderizar(USUARIO_COCINERO);

    expect(screen.getByRole('link', { name: 'Cocina' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Sala' })).not.toBeInTheDocument();
  });

  it('el encargado ve dashboard y el administrador ve carta', () => {
    const { unmount } = renderizar(USUARIO_ENCARGADO);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    unmount();

    renderizar(USUARIO_ADMIN);
    expect(screen.getByRole('link', { name: 'Carta' })).toBeInTheDocument();
  });
});
