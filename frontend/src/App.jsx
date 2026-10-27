import { Box, Center, Flex, Heading, Link as ChakraLink, Spacer, Spinner } from '@chakra-ui/react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import { inicioPorRol, modulosVisibles } from './auth/rutas.js';
import Conexion from './components/Conexion.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import UsuarioMenu from './components/UsuarioMenu.jsx';
import CierreCuenta from './pages/CierreCuenta.jsx';
import CocinaPage from './pages/CocinaPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Mesas from './pages/Mesas.jsx';
import ModuloPendiente from './pages/ModuloPendiente.jsx';
import PaginaDashboard from './pages/PaginaDashboard.jsx';
import PaginaGestionCarta from './pages/PaginaGestionCarta.jsx';
import SalaEstado from './pages/SalaEstado.jsx';
import SalaPage from './pages/SalaPage.jsx';

export default function App() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="teal.500" />
      </Center>
    );
  }

  if (!usuario) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const modulos = modulosVisibles(usuario.rol);

  return (
    <Box minH="100vh">
      <Flex as="header" bg="white" borderBottomWidth="1px" px={6} py={3} align="center" gap={6}>
        <Heading as="h1" size="md" color="teal.700">
          Foodware
        </Heading>
        <Flex as="nav" gap={4} fontSize="sm" fontWeight="medium">
          {modulos.map((modulo) => (
            <ChakraLink as={Link} key={modulo.ruta} to={modulo.ruta} color="gray.700">
              {modulo.nombre}
            </ChakraLink>
          ))}
        </Flex>
        <Spacer />
        <Conexion />
        <UsuarioMenu />
      </Flex>

      <Box as="main" px={6} py={8} maxW="6xl" mx="auto">
        <Routes>
          <Route path="/" element={<Navigate to={inicioPorRol(usuario.rol)} replace />} />
          <Route path="/login" element={<Navigate to={inicioPorRol(usuario.rol)} replace />} />
          <Route
            path="/sala"
            element={
              <RutaProtegida roles={['camarero']}>
                <Mesas />
              </RutaProtegida>
            }
          />
          <Route
            path="/sala/estado"
            element={
              <RutaProtegida roles={['camarero']}>
                <SalaEstado />
              </RutaProtegida>
            }
          />
          <Route
            path="/sala/platos"
            element={
              <RutaProtegida roles={['camarero']}>
                <SalaPage />
              </RutaProtegida>
            }
          />
          <Route
            path="/cuentas"
            element={
              <RutaProtegida roles={['camarero']}>
                <CierreCuenta />
              </RutaProtegida>
            }
          />
          <Route
            path="/cocina"
            element={
              <RutaProtegida roles={['cocinero']}>
                <CocinaPage />
              </RutaProtegida>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RutaProtegida roles={['encargado']}>
                <PaginaDashboard />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin"
            element={
              <RutaProtegida roles={['administrador']}>
                <PaginaGestionCarta />
              </RutaProtegida>
            }
          />
          <Route
            path="/admin/carta"
            element={
              <RutaProtegida roles={['administrador']}>
                <PaginaGestionCarta />
              </RutaProtegida>
            }
          />
          <Route path="*" element={<ModuloPendiente nombre="Página no encontrada" />} />
        </Routes>
      </Box>
    </Box>
  );
}
