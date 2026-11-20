import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import { formatearEuros } from '../utils/formato.js';
import { NOMBRES_PARTIDA, PARTIDAS } from '../utils/partidas.js';

export default function SelectorPlatos({ platos = [], puedeEditar = false, onAnadir }) {
  const [cantidades, setCantidades] = useState({});
  const [indicaciones, setIndicaciones] = useState({});

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
              <Box key={plato.id} py={2} borderBottomWidth="1px" borderColor="gray.100">
                <Flex align="baseline" justify="space-between" gap={2} mb={2}>
                  <Text fontSize="sm">{plato.nombre}</Text>
                  <Text fontSize="sm" color="gray.600" textAlign="right" whiteSpace="nowrap">
                    {formatearEuros(plato.precio_centimos)}
                  </Text>
                </Flex>
                <Flex align="center" gap={2} flexWrap="wrap">
                  <NumberInput
                    value={cantidadDe(plato.id)}
                    min={1}
                    max={99}
                    size="sm"
                    maxW="80px"
                    flexShrink={0}
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
                  <Input
                    size="sm"
                    flex="1 1 140px"
                    minW="120px"
                    maxW="220px"
                    placeholder="Indicaciones (opcional)"
                    aria-label={`Indicaciones para ${plato.nombre}`}
                    value={indicaciones[plato.id] ?? ''}
                    isDisabled={!puedeEditar}
                    onChange={(evento) => {
                      const valor = evento.target.value;
                      setIndicaciones((previas) => ({ ...previas, [plato.id]: valor }));
                    }}
                  />
                  <Button
                    size="sm"
                    colorScheme="teal"
                    variant="outline"
                    height="auto"
                    minH={8}
                    py={1}
                    px={3}
                    whiteSpace="normal"
                    flexShrink={0}
                    maxW="100%"
                    isDisabled={!puedeEditar}
                    onClick={() =>
                      onAnadir?.(
                        plato.id,
                        cantidadDe(plato.id),
                        indicaciones[plato.id]?.trim() || null,
                      )
                    }
                  >
                    Añadir {plato.nombre}
                  </Button>
                </Flex>
              </Box>
            ))}
          </Box>
        );
      })}
    </Box>
  );
}
