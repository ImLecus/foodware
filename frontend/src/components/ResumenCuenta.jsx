import {
  Alert,
  AlertDescription,
  AlertIcon,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { formatearEuros } from '../utils/formato.js';

/** Resumen de la cuenta abierta: consumos y total en euros. */
export default function ResumenCuenta({ cuenta, cargando = false }) {
  if (cargando) {
    return (
      <Flex align="center" gap={3} py={6}>
        <Spinner />
        <Text color="gray.600">Cargando la cuenta…</Text>
      </Flex>
    );
  }

  const consumos = cuenta?.consumos ?? [];
  const total = cuenta?.total_centimos ?? 0;
  const platosPendientes = cuenta?.platos_pendientes ?? [];

  return (
    <Card>
      <CardBody>
        <Heading size="sm" mb={3}>
          Consumos
        </Heading>

        {platosPendientes.length > 0 && (
          <Alert status="warning" borderRadius="md" mb={3}>
            <AlertIcon />
            <AlertDescription>
              Hay platos pendientes en cocina. No se puede cerrar la cuenta hasta que estén listos.
              <Stack spacing={0} mt={2}>
                {platosPendientes.map((plato) => (
                  <Text key={plato.linea_id} fontSize="sm">
                    {plato.nombre} · {plato.partida}
                  </Text>
                ))}
              </Stack>
            </AlertDescription>
          </Alert>
        )}

        {consumos.length === 0 ? (
          <Text color="gray.600">La mesa no tiene consumos.</Text>
        ) : (
          <Stack spacing={2}>
            {consumos.map((consumo) => (
              <Flex key={consumo.linea_id} justify="space-between" align="center" gap={4}>
                <HStack spacing={2}>
                  <Text>{consumo.nombre}</Text>
                  <Text color="gray.500" fontSize="sm">
                    ×{consumo.cantidad}
                  </Text>
                </HStack>
                <Text whiteSpace="nowrap">{formatearEuros(consumo.importe_centimos)}</Text>
              </Flex>
            ))}
          </Stack>
        )}

        <Divider my={4} />

        <Flex justify="space-between" align="center">
          <Text fontWeight="semibold">Total</Text>
          <Text fontWeight="bold" fontSize="xl">
            {formatearEuros(total)}
          </Text>
        </Flex>
      </CardBody>
    </Card>
  );
}
