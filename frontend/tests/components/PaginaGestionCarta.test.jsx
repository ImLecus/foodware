import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PaginaGestionCarta from '../../src/pages/PaginaGestionCarta.jsx';

vi.mock('../../src/services/cartaClient.js', () => ({
  obtenerCartaAdmin: vi.fn(() => Promise.resolve([])),
  crearPlato: vi.fn(),
  actualizarPlato: vi.fn(),
  obtenerIngredientes: vi.fn(() => Promise.resolve([])),
  crearIngrediente: vi.fn(),
  actualizarIngrediente: vi.fn(),
}));

vi.mock('../../src/services/sesion.js', () => ({
  USUARIO_ID: 'admin-1',
}));

describe('PaginaGestionCarta', () => {
  it('muestra estado cargando o vacío', async () => {
    render(<PaginaGestionCarta />);
    await waitFor(() => {
      expect(screen.getByText(/Gestión de la carta/i)).toBeInTheDocument();
    });
  });

  it('avisa de que la disponibilidad solo afecta a pedidos nuevos', async () => {
    render(<PaginaGestionCarta />);
    await waitFor(() => {
      expect(screen.getByText(/Los cambios de disponibilidad afectan solo a la carta vigente/i))
        .toBeInTheDocument();
    });
  });
});
