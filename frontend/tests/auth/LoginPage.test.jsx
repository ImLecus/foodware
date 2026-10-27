import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

function renderizar() {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/sala" element={<p>Pantalla de sala</p>} />
            <Route path="/cocina" element={<p>Pantalla de cocina</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const error = new Error('No autenticado');
    error.status = 401;
    obtenerSesion.mockRejectedValue(error);
  });

  it('inicia sesión y navega al inicio del rol', async () => {
    iniciarSesion.mockResolvedValue({
      id: 'camarero-1',
      nombre: 'Ana',
      rol: 'camarero',
      partida: null,
    });

    renderizar();
    fireEvent.change(screen.getByLabelText(/Usuario/), { target: { value: 'camarero-1' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'demo1234' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Pantalla de sala')).toBeInTheDocument();
    expect(iniciarSesion).toHaveBeenCalledWith('camarero-1', 'demo1234');
  });

  it('muestra un error genérico si las credenciales no son válidas', async () => {
    iniciarSesion.mockRejectedValue(new Error('Usuario o contraseña incorrectos'));

    renderizar();
    fireEvent.change(screen.getByLabelText(/Usuario/), { target: { value: 'camarero-1' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'incorrecta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
  });

  it('mantiene los campos accesibles y el foco en el formulario', async () => {
    renderizar();

    await waitFor(() => expect(obtenerSesion).toHaveBeenCalled());
    expect(screen.getByLabelText(/Usuario/)).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute('type', 'password');
  });
});
