import { Box, Flex, Heading, Link as ChakraLink, Spacer } from '@chakra-ui/react';
import { Link, Route, Routes } from 'react-router-dom';
import Conexion from './components/Conexion.jsx';
import CocinaPage from './pages/CocinaPage.jsx';
import Home from './pages/Home.jsx';
import Mesas from './pages/Mesas.jsx';
import ModuloPendiente from './pages/ModuloPendiente.jsx';
import PaginaDashboard from './pages/PaginaDashboard.jsx';
import RutaEncargado from './components/RutaEncargado.jsx';
import SalaPage from './pages/SalaPage.jsx';
import { ROL } from './services/sesion.js';

const modulos = [
  { ruta: '/sala', nombre: 'Sala' },
  { ruta: '/cocina', nombre: 'Cocina' },
  { ruta: '/cuentas', nombre: 'Cuentas' },
  { ruta: '/dashboard', nombre: 'Dashboard', rol: 'encargado' },
  { ruta: '/admin', nombre: 'Carta' },
];

const modulosVisibles = modulos.filter((modulo) => !modulo.rol || modulo.rol === ROL);

export default function App() {
  return (
    <Box minH="100vh">
      <Flex as="header" bg="white" borderBottomWidth="1px" px={6} py={3} align="center" gap={6}>
        <Heading as="h1" size="md" color="teal.700">
          Foodware
        </Heading>
        <Flex as="nav" gap={4} fontSize="sm" fontWeight="medium">
          {modulosVisibles.map((modulo) => (
            <ChakraLink as={Link} key={modulo.ruta} to={modulo.ruta} color="gray.700">
              {modulo.nombre}
            </ChakraLink>
          ))}
        </Flex>
        <Spacer />
        <Conexion />
      </Flex>

      <Box as="main" px={6} py={8} maxW="6xl" mx="auto">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sala" element={<Mesas />} />
          <Route path="/sala/platos" element={<SalaPage />} />
          <Route path="/cocina" element={<CocinaPage />} />
          <Route path="/cuentas" element={<ModuloPendiente nombre="Cuentas" />} />
          <Route
            path="/dashboard"
            element={
              <RutaEncargado>
                <PaginaDashboard />
              </RutaEncargado>
            }
          />
          <Route path="/admin" element={<ModuloPendiente nombre="Carta y administración" />} />
          <Route path="*" element={<ModuloPendiente nombre="Página no encontrada" />} />
        </Routes>
      </Box>
    </Box>
  );
}
