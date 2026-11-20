import {
  Alert,
  AlertDescription,
  AlertIcon,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import { formatearEuros } from '../utils/formato.js';

/** Ticket final de la cuenta, o aviso mientras aún queden partes pendientes. */
export default function TicketFinal({ ticket, ticketEstado = 'no_emitido', hayDivision = false }) {
  if (!ticket) {
    if (!hayDivision || ticketEstado === 'emitido') return null;

    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          No se emitirá el ticket hasta pagar la última parte de la cuenta.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card data-testid="ticket-final">
      <CardBody>
        <Heading size="sm" mb={3}>
          Ticket final
        </Heading>

        <Flex justify="space-between" align="center" gap={4} mb={3}>
          <Text fontWeight="medium">{ticket.identificador}</Text>
          <Text color="gray.600" fontSize="sm">
            {formatearEuros(ticket.total_centimos)}
          </Text>
        </Flex>

        <Stack spacing={2}>
          {ticket.partes.map((parte) => (
            <Flex key={parte.orden} justify="space-between" align="center" gap={4}>
              <Text>
                {parte.comensal} · Parte {parte.orden}
              </Text>
              <Text whiteSpace="nowrap">{formatearEuros(parte.importe_centimos)}</Text>
            </Flex>
          ))}
        </Stack>

        <Divider my={4} />

        <Flex justify="space-between" align="center">
          <Text fontWeight="semibold">Total</Text>
          <Text fontWeight="bold" fontSize="xl">
            {formatearEuros(ticket.total_centimos)}
          </Text>
        </Flex>
      </CardBody>
    </Card>
  );
}
