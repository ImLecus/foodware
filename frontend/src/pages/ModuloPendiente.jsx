import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Heading,
  Text,
} from '@chakra-ui/react';

export default function ModuloPendiente({ nombre }) {
  return (
    <Box>
      <Heading size="lg" mb={4}>
        {nombre}
      </Heading>
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Módulo en construcción</AlertTitle>
          <AlertDescription>
            La ruta y el esqueleto están listos. La funcionalidad se implementa en su historia
            correspondiente.
          </AlertDescription>
        </Box>
      </Alert>
      <Text mt={4} color="gray.600" fontSize="sm">
        Revisa la especificación y las tareas de la historia antes de empezar.
      </Text>
    </Box>
  );
}
