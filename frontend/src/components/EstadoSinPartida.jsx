import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';

export default function EstadoSinPartida() {
  return (
    <Alert status="warning" borderRadius="md">
      <AlertIcon />
      <div>
        <AlertTitle>No tienes una partida asignada</AlertTitle>
        <AlertDescription>
          Pide a la persona encargada que asigne tu partida antes de usar la vista de cocina.
        </AlertDescription>
      </div>
    </Alert>
  );
}
