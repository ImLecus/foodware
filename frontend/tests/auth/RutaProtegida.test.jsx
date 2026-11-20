import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import RutaProtegida from '../../src/components/RutaProtegida.jsx';
import {
  ProveedorSesion,
  USUARIO_CAMARERO,
  USUARIO_ENCARGADO,
} from '../helpers/auth.jsx';

function renderizar(usuario, roles = ['encargado']) {
  return render(
    <ChakraProvider>
      <ProveedorSesion usuario={usuario}>
        <MemoryRouter initialEntries={['/privado']}>
          <Routes>
            <Route
              path="/privado"
              element={
                <RutaProtegida roles={roles}>
                  <p>contenido protegido</p>
                </RutaProtegida>
              }
            />
            <Route path="/login" element={<p>Pantalla de login</p>} />
          </Routes>
        </MemoryRouter>
      </ProveedorSesion>
    </ChakraProvider>,
  );
}

describe('RutaProtegida', () => {
  it('muestra el contenido si el rol está permitido', () => {
    renderizar(USUARIO_ENCARGADO);

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });

  it('muestra acceso denegado si el rol no está permitido', () => {
    renderizar(USUARIO_CAMARERO);

    expect(screen.getByText('Acceso denegado')).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });

  it('redirige al login si no hay sesión', () => {
    renderizar(null);

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });
});
