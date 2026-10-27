import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, HStack } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

export default function AvisoPedidoCompletado({
  pedidoId,
  lineaId,
  onDeshacer,
  onCerrar,
  duracionMs = 10_000,
}) {
  const [visible, setVisible] = useState(true);
  const onCerrarRef = useRef(onCerrar);

  useEffect(() => {
    onCerrarRef.current = onCerrar;
  }, [onCerrar]);

  useEffect(() => {
    setVisible(true);
  }, [pedidoId, lineaId]);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      setVisible(false);
      onCerrarRef.current?.();
    }, duracionMs);

    return () => clearTimeout(temporizador);
  }, [duracionMs]);

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
            onCerrar?.();
          }}
        >
          Deshacer
        </Button>
      </HStack>
    </Alert>
  );
}
