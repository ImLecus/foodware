import { Badge, Button, HStack, Text, VStack } from '@chakra-ui/react';
import { formatearHora } from '../utils/formato.js';

export default function LineaPlato({ linea, onMarcarListo, onDeshacer, deshabilitado = false }) {
  const listo = linea.estado === 'listo';
  const etiqueta = listo ? 'listo' : 'pendiente';
  const accion = listo ? onDeshacer : onMarcarListo;

  return (
    <HStack justify="space-between" align="center">
      <VStack align="start" spacing={0}>
        <Text fontSize="sm">
          {linea.nombrePlato} × {linea.cantidad}
        </Text>
        {listo && linea.listoEn && (
          <Text fontSize="xs" color="gray.500">
            Preparado a las {formatearHora(linea.listoEn)}
          </Text>
        )}
      </VStack>
      <HStack spacing={2}>
        <Badge
          colorScheme={listo ? 'green' : 'gray'}
          aria-label={`${linea.nombrePlato}: ${etiqueta}`}
        >
          {etiqueta}
        </Badge>
        {accion && (
          <Button
            size="xs"
            variant="outline"
            colorScheme={listo ? 'gray' : 'teal'}
            onClick={() => accion(linea)}
            isDisabled={deshabilitado}
          >
            {listo ? 'Deshacer' : 'Marcar listo'}
          </Button>
        )}
      </HStack>
    </HStack>
  );
}
