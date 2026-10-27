import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

function AccesoDenegado() {
  return (
    <Alert status="error" borderRadius="md">
      <AlertIcon />
      <Box>
        <AlertTitle>Acceso denegado</AlertTitle>
        <AlertDescription>No tienes permisos para acceder a esta sección.</AlertDescription>
      </Box>
    </Alert>
  );
}

export default function RutaProtegida({ roles, children }) {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <Center py={16}>
        <Spinner size="lg" color="teal.500" />
      </Center>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (Array.isArray(roles) && !roles.includes(usuario.rol)) {
    return <AccesoDenegado />;
  }

  return children;
}
