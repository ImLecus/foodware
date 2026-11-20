import { Badge, Button, Flex, Text } from '@chakra-ui/react';
import { formatearEuros } from '../utils/formato.js';

/**
 * Una parte de la cuenta: comensal e importe, su estado de pago y las acciones
 * para marcarla como pagada o deshacer el pago mientras la mesa siga abierta.
 */
export default function ParteCuenta({
  parte,
  onPagar,
  onDeshacer,
  pagando = false,
  deshabilitado = false,
}) {
  const pagada = parte.estado === 'pagada';
  const conAcciones = Boolean(onPagar || onDeshacer);

  function deshacer() {
    if (typeof window.confirm === 'function' && !window.confirm(`¿Deshacer el pago de ${parte.comensal}?`)) {
      return;
    }
    onDeshacer?.();
  }

  return (
    <Flex align="center" justify="space-between" gap={3} wrap="wrap">
      <Flex align="center" gap={3} flex="1">
        <Text fontSize="sm" color="gray.600" whiteSpace="nowrap">
          Parte {parte.orden}
        </Text>

        <Text fontWeight="medium">{parte.comensal}</Text>

        <Badge colorScheme={pagada ? 'green' : 'gray'}>
          {pagada ? 'Pagada' : 'Pendiente'}
        </Badge>
      </Flex>

      <Flex align="center" gap={3}>
        <Text fontWeight="semibold" whiteSpace="nowrap">
          {formatearEuros(parte.importe_centimos)}
        </Text>

        {conAcciones && (
          <Button
            size="sm"
            variant={pagada ? 'outline' : 'solid'}
            colorScheme="teal"
            onClick={pagada ? deshacer : onPagar}
            isDisabled={deshabilitado || pagando}
          >
            {pagando ? 'Guardando…' : pagada ? 'Deshacer pago' : 'Marcar como pagada'}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
