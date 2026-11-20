import { Alert, AlertIcon, Box, Text } from '@chakra-ui/react';

export default function EstadoConexion({ mensaje = 'Sin conexión. Revisa la red e inténtalo de nuevo.' }) {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minH="200px" width="100%">
      <Alert status="warning" maxW="md" borderRadius="md">
        <AlertIcon />
        <Text>{mensaje}</Text>
      </Alert>
    </Box>
  );
}
