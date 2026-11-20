import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../src/auth/AuthContext.jsx';
import { apiGet } from '../../src/services/api.js';

function PantallaProtegida() {
  const { usuario } = useAuth();

  if (!usuario) {
    return <p>Pantalla de login</p>;
  }

  return (
    <div>
      <p>Sesión de {usuario.nombre}</p>
      <button type="button" onClick={() => apiGet('/mesas').catch(() => {})}>
        Cargar sala
      </button>
    </div>
  );
}

function respuesta(cuerpo, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => cuerpo };
}

describe('Caducidad de sesión durante una operación', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retira la sesión y vuelve al login cuando una petición protegida responde 401', async () => {
    fetch
      .mockResolvedValueOnce(
        respuesta({ id: 'camarero-1', nombre: 'Ana', rol: 'camarero', partida: null }),
      )
      .mockResolvedValueOnce(
        respuesta(
          { codigo: 'sesion_invalida', mensaje: 'Sesión no válida o caducada' },
          { ok: false, status: 401 },
        ),
      );

    render(
      <AuthProvider>
        <PantallaProtegida />
      </AuthProvider>,
    );

    expect(await screen.findByText('Sesión de Ana')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cargar sala' }));

    expect(await screen.findByText('Pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('Sesión de Ana')).not.toBeInTheDocument();
  });
});
