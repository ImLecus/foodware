import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../src/auth/AuthContext.jsx';
import LoginPage from '../../src/pages/LoginPage.jsx';
import { iniciarSesion, obtenerSesion } from '../../src/services/api.js';

vi.mock('../../src/services/api.js', () => ({
  iniciarSesion: vi.fn(),
  obtenerSesion: vi.fn(),
  cerrarSesion: vi.fn(),
}));

describe('Credenciales demo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const error = new Error('No autenticado');
    error.status = 401;
    obtenerSesion.mockRejectedValue(error);
  });

  it('permite iniciar sesión con usuario demo y contraseña demo1234', async () => {
    iniciarSesion.mockResolvedValue({
      id: 'cocinero-entrantes',
      nombre: 'Marta',
      rol: 'cocinero',
      partida: 'entrantes',
    });

    render(
      <ChakraProvider>
        <MemoryRouter initialEntries={['/login']}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cocina" element={<p>Pantalla de cocina</p>} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      </ChakraProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Usuario/), {
      target: { value: 'cocinero-entrantes' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Pantalla de cocina')).toBeInTheDocument();
    expect(iniciarSesion).toHaveBeenCalledWith('cocinero-entrantes', 'demo1234');
  });
});
