import { Badge, HStack, Text } from '@chakra-ui/react';

export default function LineaPlato({ linea }) {
  return (
    <HStack justify="space-between" align="center">
      <Text fontSize="sm">
        {linea.nombrePlato} × {linea.cantidad}
      </Text>
      <Badge>{linea.estado}</Badge>
    </HStack>
  );
}
