import { vi } from 'vitest';
import { AuthContext } from '../../src/auth/AuthContext.jsx';

export const USUARIO_CAMARERO = {
  id: 'camarero-1',
  nombre: 'Ana',
  rol: 'camarero',
  partida: null,
};

export const USUARIO_COCINERO = {
  id: 'cocinero-entrantes',
  nombre: 'Marta',
  rol: 'cocinero',
  partida: 'entrantes',
};

export const USUARIO_COCINERO_SIN_PARTIDA = {
  id: 'cocinero-sin-partida',
  nombre: 'Sin partida',
  rol: 'cocinero',
  partida: null,
};

export const USUARIO_ENCARGADO = {
  id: 'encargado-1',
  nombre: 'Carmen',
  rol: 'encargado',
  partida: null,
};

export const USUARIO_ADMIN = {
  id: 'admin-1',
  nombre: 'Administración',
  rol: 'administrador',
  partida: null,
};

export function ProveedorSesion({ usuario = USUARIO_CAMARERO, children }) {
  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando: false,
        login: vi.fn(),
        logout: vi.fn(),
        recargar: vi.fn(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
