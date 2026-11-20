import { Box, Card, CardBody, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react';

const modulos = [
  {
    titulo: 'Sala',
    descripcion: 'Abrir mesas, tomar pedidos y consultar el estado de los platos.',
  },
  {
    titulo: 'Cocina',
    descripcion: 'Ver pedidos pendientes por partida y marcar platos como listos.',
  },
  {
    titulo: 'Cuentas',
    descripcion: 'Cerrar la cuenta, dividirla entre comensales y emitir el ticket.',
  },
  {
    titulo: 'Dashboard',
    descripcion: 'Consultar ventas del último servicio y compararlas con el día anterior.',
  },
  {
    titulo: 'Carta',
    descripcion: 'Gestionar platos, precios, disponibilidad e ingredientes.',
  },
];

export default function Home() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">Esqueleto base del sistema</Heading>
        <Text color="gray.600" mt={2}>
          Cada módulo se implementa en paralelo por el equipo. Las rutas ya existen y muestran una
          página provisional hasta que su historia esté terminada.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {modulos.map((modulo) => (
          <Card key={modulo.titulo}>
            <CardBody>
              <Heading size="sm" mb={2}>
                {modulo.titulo}
              </Heading>
              <Text fontSize="sm" color="gray.600">
                {modulo.descripcion}
              </Text>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
