import { Badge, HStack, Text } from '@chakra-ui/react';

export default function LineaPlato({ linea }) {
  const listo = linea.estado === 'listo';
  const etiqueta = listo ? 'listo' : 'pendiente';

  return (
    <HStack justify="space-between" align="center">
      <Text fontSize="sm">
        {linea.nombrePlato} × {linea.cantidad}
      </Text>
      <Badge
        colorScheme={listo ? 'green' : 'gray'}
        aria-label={`${linea.nombrePlato}: ${etiqueta}`}
      >
        {etiqueta}
      </Badge>
    </HStack>
  );
}
