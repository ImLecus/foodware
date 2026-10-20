import { Button, Flex, Text } from '@chakra-ui/react';

/**
 * Acción explícita para comunicar a cocina los cambios del pedido (FR-014).
 * No se envía nada al guardar: el camarero debe pulsar este botón.
 */
export default function EnviarCambios({ cambiosPendientes = false, enLinea = true, onEnviar }) {
  return (
    <Flex direction="column" align="flex-start" gap={1}>
      <Button
        colorScheme="teal"
        isDisabled={!enLinea || !cambiosPendientes}
        onClick={() => onEnviar?.()}
      >
        Enviar cambios
      </Button>
      <Text fontSize="xs" color={cambiosPendientes ? 'orange.600' : 'gray.500'}>
        {cambiosPendientes
          ? 'Hay cambios sin comunicar a cocina.'
          : 'Los cambios se comunican a cocina de forma explícita.'}
      </Text>
    </Flex>
  );
}
