import { Flex, Input, Text } from '@chakra-ui/react';
import { formatearEuros } from '../utils/formato.js';

/** Una parte de la cuenta: comensal editable e importe asignado. */
export default function ParteCuenta({ parte, onCambiarComensal }) {
  return (
    <Flex align="center" justify="space-between" gap={3}>
      <Flex align="center" gap={3} flex="1">
        <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
          Parte {parte.orden}
        </Text>
        <Input
          size="sm"
          maxW="220px"
          aria-label={`Comensal de la parte ${parte.orden}`}
          value={parte.comensal}
          onChange={(evento) => onCambiarComensal?.(evento.target.value)}
        />
      </Flex>
      <Text fontWeight="semibold" whiteSpace="nowrap">
        {formatearEuros(parte.importe_centimos)}
      </Text>
    </Flex>
  );
}
