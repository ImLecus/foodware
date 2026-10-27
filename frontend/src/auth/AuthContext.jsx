import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  cerrarSesion as cerrarSesionApi,
  iniciarSesion,
  obtenerSesion,
} from '../services/api.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      setUsuario(await obtenerSesion());
    } catch (error) {
      if (error?.status !== 401 && error?.codigo !== 'sin_conexion') {
        console.error('No se pudo comprobar la sesión', error);
      }
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    const cerrarPorSesionExpirada = () => setUsuario(null);
    window.addEventListener('foodware:sesion-expirada', cerrarPorSesionExpirada);
    return () =>
      window.removeEventListener('foodware:sesion-expirada', cerrarPorSesionExpirada);
  }, []);

  const login = useCallback(async (usuarioId, password) => {
    const datos = await iniciarSesion(usuarioId, password);
    setUsuario(datos);
    return datos;
  }, []);

  const logout = useCallback(async () => {
    try {
      await cerrarSesionApi();
    } finally {
      setUsuario(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, recargar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
}
