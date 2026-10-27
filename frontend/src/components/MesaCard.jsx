import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import PlatoEstado from './PlatoEstado.jsx';

const NOMBRES_PARTIDA = {
  entrantes: 'Entrantes',
  principales: 'Principales',
  postres: 'Postres',
};

export default function MesaCard({ mesa }) {
  const platos = Array.isArray(mesa?.platos) ? mesa.platos : [];

  const agrupados = platos.reduce((acc, plato) => {
    const partida = plato.partida || 'sin-partida';
    if (!acc[partida]) acc[partida] = [];
    acc[partida].push(plato);
    return acc;
  }, {});

  const partidasOrdenadas = Object.keys(agrupados).sort((a, b) => {
    const orden = { entrantes: 0, principales: 1, postres: 2 };
    return (orden[a] ?? 99) - (orden[b] ?? 99);
  });

  return (
    <Box borderWidth="1px" borderRadius="lg" bg="white" p={4} shadow="sm">
      <Stack spacing={3}>
        <Heading as="h3" size="md">
          {mesa?.identificador || mesa?.id}
        </Heading>
        {partidasOrdenadas.length === 0 ? (
          <Text color="gray.600" fontSize="sm">
            Sin platos enviados
          </Text>
        ) : (
          partidasOrdenadas.map((partida) => (
            <Box key={partida}>
              <Text fontWeight="semibold" mb={2}>
                {NOMBRES_PARTIDA[partida] || partida}
              </Text>
              <Stack spacing={2}>
                {agrupados[partida].map((plato) => (
                  <Box
                    key={plato.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    borderWidth="1px"
                    borderRadius="md"
                    px={3}
                    py={2}
                  >
                    <Box>
                      <Text fontWeight="medium">
                        {plato.cantidad} × {plato.nombre}
                      </Text>
                    </Box>
                    <PlatoEstado estado={plato.estado} />
                  </Box>
                ))}
              </Stack>
            </Box>
          ))
        )}
      </Stack>
    </Box>
  );
}
