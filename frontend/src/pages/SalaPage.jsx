import { Box, Heading, ListItem, Stack, Text, UnorderedList } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import EstadoCarga from '../components/EstadoCarga.jsx';
import LineaPlato from '../components/LineaPlato.jsx';
import { obtenerEstadoPlatos } from '../services/api.js';

function resolverMesa(mesaId) {
  if (mesaId) return mesaId;
  return new URLSearchParams(window.location.search).get('mesa') ?? 'mesa-1';
}

export default function SalaPage({ mesaId, numeroMesa }) {
  const id = resolverMesa(mesaId);
  const numero = numeroMesa ?? (Number(String(id).replace(/\D/g, '')) || 1);
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const datos = await obtenerEstadoPlatos(id);
        if (cancelado) return;
        setLineas(datos);
      } catch (fallo) {
        if (cancelado) return;
        setError(fallo.message ?? 'No se pudo cargar el estado de la mesa');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [id]);

  return (
    <Box>
      <Heading size="lg" mb={1}>
        Mesa {numero}
      </Heading>
      <Text color="gray.600" mb={6}>
        Estado de los platos de la mesa
      </Text>

      {cargando && <EstadoCarga />}

      {!cargando && error && (
        <Text color="red.600" role="alert">
          {error}
        </Text>
      )}

      {!cargando && !error && lineas.length === 0 && (
        <Text color="gray.600">No hay platos en esta mesa.</Text>
      )}

      {!cargando && !error && lineas.length > 0 && (
        <Stack spacing={2}>
          {lineas.map((linea) => (
            <Box key={linea.id} bg="white" borderWidth="1px" borderRadius="md" p={3}>
              <UnorderedList listStyleType="none" m={0}>
                <ListItem>
                  <LineaPlato linea={linea} />
                </ListItem>
              </UnorderedList>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
