import { Box, Button, Flex, Heading, NumberInput, NumberInputField, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { formatearEuros } from '../utils/formato.js';
import { NOMBRES_PARTIDA, PARTIDAS } from '../utils/partidas.js';

export default function SelectorPlatos({ platos = [], puedeEditar = false, onAnadir }) {
  const [cantidades, setCantidades] = useState({});

  function cantidadDe(platoId) {
    return cantidades[platoId] ?? 1;
  }

  return (
    <Box>
      {!puedeEditar && (
        <Text fontSize="sm" color="gray.600" mb={3}>
          Abre o selecciona un pedido en curso para añadir platos.
        </Text>
      )}

      {PARTIDAS.map((partida) => {
        const platosDePartida = platos.filter((plato) => plato.partida === partida);
        if (platosDePartida.length === 0) return null;

        return (
          <Box key={partida} mb={4}>
            <Heading size="xs" mb={2} color="teal.700">
              {NOMBRES_PARTIDA[partida]}
            </Heading>
            {platosDePartida.map((plato) => (
              <Flex
                key={plato.id}
                align="center"
                gap={2}
                py={2}
                borderBottomWidth="1px"
                borderColor="gray.100"
              >
                <Text flex="1" fontSize="sm">
                  {plato.nombre}
                </Text>
                <Text fontSize="sm" color="gray.600" minW="70px" textAlign="right">
                  {formatearEuros(plato.precio_centimos)}
                </Text>
                <NumberInput
                  value={cantidadDe(plato.id)}
                  min={1}
                  max={99}
                  size="sm"
                  maxW="80px"
                  isDisabled={!puedeEditar}
                  onChange={(valor) => {
                    const cantidad = Number(valor);
                    if (Number.isInteger(cantidad) && cantidad >= 1) {
                      setCantidades((previas) => ({ ...previas, [plato.id]: cantidad }));
                    }
                  }}
                >
                  <NumberInputField aria-label={`Cantidad para ${plato.nombre}`} />
                </NumberInput>
                <Button
                  size="sm"
                  colorScheme="teal"
                  variant="outline"
                  isDisabled={!puedeEditar}
                  onClick={() => onAnadir?.(plato.id, cantidadDe(plato.id))}
                >
                  Añadir {plato.nombre}
                </Button>
              </Flex>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
