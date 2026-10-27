import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/auth/AuthContext.jsx';
import UsuarioMenu from '../../src/components/UsuarioMenu.jsx';
import { cerrarSesion, obtenerSesion } from '../../src/services/api.js';

vi.mock('../../src/services/api.js', () => ({
  iniciarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
  cerrarSesion: vi.fn(),
}));

describe('Sesión persistente y logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cerrarSesion.mockResolvedValue(null);
  });

  it('carga el usuario desde /auth/me al montar', async () => {
    obtenerSesion.mockResolvedValue({
      id: 'encargado-1',
      nombre: 'Carmen',
      rol: 'encargado',
      partida: null,
    });

    render(
      <ChakraProvider>
        <MemoryRouter>
          <AuthProvider>
            <UsuarioMenu />
          </AuthProvider>
        </MemoryRouter>
      </ChakraProvider>,
    );

    expect(await screen.findByText('Carmen')).toBeInTheDocument();
    expect(screen.getByText('Encargado')).toBeInTheDocument();
  });

  it('cierra la sesión y deja de mostrar al usuario', async () => {
    obtenerSesion.mockResolvedValue({
      id: 'camarero-1',
      nombre: 'Ana',
      rol: 'camarero',
      partida: null,
    });

    render(
      <ChakraProvider>
        <MemoryRouter>
          <AuthProvider>
            <UsuarioMenu />
          </AuthProvider>
        </MemoryRouter>
      </ChakraProvider>,
    );

    await screen.findByText('Ana');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => expect(cerrarSesion).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Ana')).not.toBeInTheDocument());
  });
});
