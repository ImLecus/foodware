import { Box, Text } from '@chakra-ui/react';

export default function EstadoVacio({
  mensaje = 'No hay pedidos pendientes',
  descripcion = 'Cuando llegue un pedido nuevo para tu partida aparecerá aquí.',
} = {}) {
  return (
    <Box borderWidth="1px" borderRadius="md" bg="white" p={8} textAlign="center">
      <Text fontWeight="semibold">{mensaje}</Text>
      <Text color="gray.600" fontSize="sm" mt={1}>
        {descripcion}
      </Text>
    </Box>
  );
}
