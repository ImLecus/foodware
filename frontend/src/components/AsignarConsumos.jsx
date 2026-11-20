import { Box, Checkbox, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import { formatearEuros } from '../utils/formato.js';

/**
 * Asigna cada consumo a una o varias partes. Si se marca más de una parte, el
 * importe se reparte en porciones iguales al céntimo.
 */
export default function AsignarConsumos({ consumos, numeroPartes, seleccion, onAlternar }) {
  return (
    <Stack spacing={3}>
      {consumos.map((consumo) => {
        const elegidas = seleccion[consumo.linea_id] ?? [];

        return (
          <Box key={consumo.linea_id} borderWidth="1px" borderRadius="md" p={3}>
            <Flex justify="space-between" align="center" gap={4}>
              <Text fontWeight="medium">{consumo.nombre}</Text>
              <Text whiteSpace="nowrap">{formatearEuros(consumo.importe_centimos)}</Text>
            </Flex>
            <HStack mt={2} spacing={4} wrap="wrap">
              {Array.from({ length: numeroPartes }, (_, indice) => indice + 1).map((orden) => (
                <Checkbox
                  key={orden}
                  isChecked={elegidas.includes(orden)}
                  onChange={() => onAlternar(consumo.linea_id, orden)}
                  aria-label={`Asignar ${consumo.nombre} a la parte ${orden}`}
                >
                  Parte {orden}
                </Checkbox>
              ))}
            </HStack>
          </Box>
        );
      })}
    </Stack>
  );
}
