import { Alert, AlertDescription, AlertIcon, AlertTitle, Button } from '@chakra-ui/react';

export default function EstadoError({ mensaje, onReintentar }) {
  return (
    <Alert status="error" borderRadius="md" flexDirection="column" alignItems="flex-start" gap={3}>
      <AlertIcon />
      <AlertTitle>No se pudieron cargar los pedidos</AlertTitle>
      <AlertDescription>{mensaje}</AlertDescription>
      <Button size="sm" colorScheme="red" onClick={onReintentar}>
        Reintentar
      </Button>
    </Alert>
  );
}
