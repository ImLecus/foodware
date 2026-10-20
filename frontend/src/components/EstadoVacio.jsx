import { Box, Text } from '@chakra-ui/react';

export default function EstadoVacio() {
  return (
    <Box borderWidth="1px" borderRadius="md" bg="white" p={8} textAlign="center">
      <Text fontWeight="semibold">No hay pedidos pendientes</Text>
      <Text color="gray.600" fontSize="sm" mt={1}>
        Cuando llegue un pedido nuevo para tu partida aparecerá aquí.
      </Text>
    </Box>
  );
}
