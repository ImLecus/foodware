import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  NumberInput,
  NumberInputField,
  Text,
} from '@chakra-ui/react';
import { formatearEuros } from '../utils/formato.js';
import { agruparPorPartida, NOMBRES_PARTIDA, PARTIDAS } from '../utils/partidas.js';

export default function Pedido({
  pedido,
  mesa,
  enLinea = true,
  onCambiarCantidad,
  onRetirarLinea,
  onConfirmar,
}) {
  const lineas = pedido.lineas ?? [];
  const porPartida = pedido.por_partida ?? agruparPorPartida(lineas);
  const enCurso = pedido.estado === 'en_curso';
  const editable = enCurso && enLinea;
  const total = lineas.reduce((suma, linea) => suma + linea.cantidad * linea.precio_centimos, 0);

  return (
    <Card>
      <CardHeader>
        <Flex align="center" justify="space-between" gap={3}>
          <Heading size="md">Pedido · {mesa?.identificador ?? 'Mesa'}</Heading>
          <Badge colorScheme={enCurso ? 'orange' : 'green'}>
            {enCurso ? 'En curso' : 'Enviada'}
          </Badge>
        </Flex>
      </CardHeader>

      <CardBody>
        {lineas.length === 0 && (
          <Text color="gray.600" mb={4}>
            Todavía no hay platos en el pedido.
          </Text>
        )}

        {PARTIDAS.map((partida) => (
          <Box key={partida} mb={4}>
            <Heading size="sm" mb={2}>
              {NOMBRES_PARTIDA[partida]}
            </Heading>
            {(porPartida[partida] ?? []).length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                Sin platos
              </Text>
            ) : (
              porPartida[partida].map((linea) => (
                <Flex
                  key={linea.id}
                  align="center"
                  gap={3}
                  py={2}
                  borderBottomWidth="1px"
                  borderColor="gray.100"
                >
                  <Text flex="1">{linea.plato_nombre}</Text>
                  <NumberInput
                    value={linea.cantidad}
                    min={1}
                    max={99}
                    size="sm"
                    maxW="90px"
                    isDisabled={!editable}
                    onChange={(valor) => {
                      const cantidad = Number(valor);
                      if (Number.isInteger(cantidad) && cantidad >= 1) {
                        onCambiarCantidad?.(linea.id, cantidad);
                      }
                    }}
                  >
                    <NumberInputField aria-label={`Cantidad de ${linea.plato_nombre}`} />
                  </NumberInput>
                  <Text fontSize="sm" color="gray.600" minW="70px" textAlign="right">
                    {formatearEuros(linea.precio_centimos)}
                  </Text>
                  <Button
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    isDisabled={!editable}
                    onClick={() => onRetirarLinea?.(linea.id)}
                  >
                    Quitar
                  </Button>
                </Flex>
              ))
            )}
          </Box>
        ))}

        <Flex justify="space-between" pt={2} fontWeight="bold">
          <Text>Total</Text>
          <Text>{formatearEuros(total)}</Text>
        </Flex>
      </CardBody>

      <CardFooter>
        <Button
          colorScheme="teal"
          isDisabled={!editable || lineas.length === 0}
          onClick={() => onConfirmar?.()}
        >
          Confirmar pedido
        </Button>
      </CardFooter>
    </Card>
  );
}
