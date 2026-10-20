import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';

export default function AvisoSinConexion() {
  return (
    <Alert status="warning" borderRadius="md" mb={4}>
      <AlertIcon />
      <div>
        <AlertTitle>Sin conexión</AlertTitle>
        <AlertDescription>
          La lista puede estar desactualizada. El tiempo de espera sigue avanzando.
        </AlertDescription>
      </div>
    </Alert>
  );
}
