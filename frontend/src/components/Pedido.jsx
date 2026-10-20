import { Badge, Box, Card, CardBody, CardHeader, Flex, Heading, Text } from '@chakra-ui/react';
import { formatearEuros } from '../utils/formato.js';
import { agruparPorPartida, NOMBRES_PARTIDA, PARTIDAS } from '../utils/partidas.js';

export default function Pedido({ pedido, mesa }) {
  const lineas = pedido.lineas ?? [];
  const porPartida = pedido.por_partida ?? agruparPorPartida(lineas);
  const enCurso = pedido.estado === 'en_curso';
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
                  <Text fontSize="sm" color="gray.600">
                    {linea.cantidad} × {formatearEuros(linea.precio_centimos)}
                  </Text>
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
    </Card>
  );
}
