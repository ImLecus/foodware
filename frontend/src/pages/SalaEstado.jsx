import { Box, Grid, Heading, Text } from '@chakra-ui/react';
import AvisoSinConexion from '../components/AvisoSinConexion.jsx';
import EstadoCarga from '../components/EstadoCarga.jsx';
import EstadoVacio from '../components/EstadoVacio.jsx';
import MesaCard from '../components/MesaCard.jsx';
import { useSala } from '../hooks/useSala.js';

export default function SalaEstado() {
  const { mesas, cargando, error, sinConexion } = useSala();

  return (
    <Box>
      <Heading size="lg" mb={2}>
        Estado de los platos por mesa
      </Heading>
      <Text color="gray.600" mb={6}>
        Señales de platos listos en tiempo real
      </Text>

      {sinConexion && <AvisoSinConexion />}

      {cargando && <EstadoCarga />}

      {!cargando && error && (
        <Text color="red.600" role="alert">
          {error.message || 'No se pudo cargar el estado de sala'}
        </Text>
      )}

      {!cargando && !error && mesas.length === 0 && (
        <EstadoVacio mensaje="No hay mesas abiertas" descripcion="Cuando haya una mesa abierta aparecerá aquí." />
      )}

      {!cargando && !error && mesas.length > 0 && (
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
          {mesas.map((mesa) => (
            <MesaCard key={mesa.id} mesa={mesa} />
          ))}
        </Grid>
      )}
    </Box>
  );
}
