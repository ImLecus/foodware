import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, HStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function AvisoPedidoCompletado({
  pedidoId,
  lineaId,
  onDeshacer,
  onCerrar,
  duracionMs = 10_000,
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setVisible(false);
      onCerrar?.();
    }, duracionMs);

    return () => clearTimeout(temporizador);
  }, [duracionMs, onCerrar]);

  if (!visible) return null;

  return (
    <Alert status="success" borderRadius="md" mb={4} alignItems="center">
      <AlertIcon />
      <HStack flex="1" justify="space-between">
        <div>
          <AlertTitle>Pedido completado</AlertTitle>
          <AlertDescription>Puedes deshacer la última marca durante 10 segundos.</AlertDescription>
        </div>
        <Button
          size="sm"
          colorScheme="green"
          variant="outline"
          onClick={() => {
            onDeshacer?.({ pedidoId, lineaId });
            setVisible(false);
          }}
        >
          Deshacer
        </Button>
      </HStack>
    </Alert>
  );
}
