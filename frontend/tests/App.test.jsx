import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { tema } from '../src/theme/index.js';
import { ProveedorSesion, USUARIO_ADMIN, USUARIO_CAMARERO } from './helpers/auth.jsx';

vi.mock('../src/services/cartaClient.js', () => ({
  obtenerCartaAdmin: vi.fn(() => Promise.resolve([])),
  crearPlato: vi.fn(),
  actualizarPlato: vi.fn(),
  obtenerIngredientes: vi.fn(() => Promise.resolve([])),
  crearIngrediente: vi.fn(),
  actualizarIngrediente: vi.fn(),
}));

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

  it('muestra una página provisional en los módulos aún no implementados', async () => {
    renderizar('/admin', USUARIO_ADMIN);

    expect(
      await screen.findByRole('heading', { name: /gestión de la carta/i }),
    ).toBeInTheDocument();
  });});
