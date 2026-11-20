import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  HStack,
  Stack,
} from '@chakra-ui/react';

/**
 * Señal destacada y persistente de una mesa con todos los platos listos.
 * Identifica la mesa, incluye el control de sonido y la acción de descartar.
 */
export default function AvisoMesa({
  mesa,
  silenciado = false,
  onAlternarSonido,
  onDescartar,
  descartarDeshabilitado = false,
}) {
  if (!mesa?.aviso) return null;

  const identificador = mesa.identificador || mesa.id;

  return (
    <Alert
      role="alert"
      aria-live="assertive"
      status="success"
      variant="left-accent"
      borderWidth="3px"
      borderColor="green.400"
      borderRadius="lg"
      bg="green.50"
      py={4}
      pr={4}
      alignItems="center"
      shadow="md"
    >
      <AlertIcon boxSize={8} mr={4} />
      <Stack flex="1" spacing={1}>
        <AlertTitle fontSize="xl" fontWeight="bold">
          Mesa completa
        </AlertTitle>
        <AlertDescription fontSize="md">
          {identificador} tiene todos los platos listos. Puedes servirla.
        </AlertDescription>
      </Stack>
      <HStack spacing={2}>
        <Button
          size="sm"
          variant="outline"
          colorScheme="green"
          aria-pressed={silenciado}
          aria-label={silenciado ? 'Activar sonido' : 'Silenciar sonido'}
          onClick={() => onAlternarSonido?.()}
        >
          {silenciado ? 'Sonido desactivado' : 'Sonido activado'}
        </Button>
        <Button
          size="sm"
          colorScheme="green"
          onClick={() => onDescartar?.()}
          isDisabled={descartarDeshabilitado}
        >
          Descartar aviso
        </Button>
      </HStack>
    </Alert>
  );
}
