import { Flex, Spinner, Text } from '@chakra-ui/react';

export default function EstadoCarga() {
  return (
    <Flex align="center" gap={3} role="status" aria-live="polite" py={6}>
      <Spinner size="md" color="teal.500" />
      <Text color="gray.600">Cargando pedidos…</Text>
    </Flex>
  );
}
