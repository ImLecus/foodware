import { Box, Heading, Text } from '@chakra-ui/react';
import { ROL } from '../services/sesion.js';

export default function RutaEncargado({ children }) {
  if (ROL !== 'encargado') {
    return (
      <Box textAlign="center" py={16}>
        <Heading size="md" mb={2}>
          Acceso restringido
        </Heading>
        <Text color="gray.600">Esta sección es solo para el encargado del turno.</Text>
      </Box>
    );
  }

  return children;
}
