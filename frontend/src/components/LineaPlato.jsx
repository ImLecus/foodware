import { Badge, Button, HStack, Text } from '@chakra-ui/react';

export default function LineaPlato({ linea, onMarcarListo, onDeshacer, deshabilitado = false }) {
  const listo = linea.estado === 'listo';
  const etiqueta = listo ? 'listo' : 'pendiente';
  const accion = listo ? onDeshacer : onMarcarListo;

  return (
    <HStack justify="space-between" align="center">
      <Text fontSize="sm">
        {linea.nombrePlato} × {linea.cantidad}
      </Text>
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
