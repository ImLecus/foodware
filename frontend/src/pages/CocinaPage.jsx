import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Heading,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import EstadoSinPartida from '../components/EstadoSinPartida.jsx';
import EstadoVacio from '../components/EstadoVacio.jsx';
import PedidoCard from '../components/PedidoCard.jsx';
import { obtenerCocinero, obtenerPedidosPendientes } from '../services/api.js';

const NOMBRES_PARTIDA = {
  entrantes: 'Entrantes',
  principales: 'Principales',
  postres: 'Postres',
};

function resolverCocineroId(cocineroId) {
  if (cocineroId) return cocineroId;
  const parametro = new URLSearchParams(window.location.search).get('cocinero');
  return parametro ?? 'cocinero-entrantes';
}

export default function CocinaPage({ cocineroId }) {
  const id = resolverCocineroId(cocineroId);
  const [cocinero, setCocinero] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datosCocinero = await obtenerCocinero(id);
        if (cancelado) return;
        setCocinero(datosCocinero);

        if (!datosCocinero.partida) {
          setPedidos([]);
          setCargando(false);
          return;
        }

        const datosPedidos = await obtenerPedidosPendientes(datosCocinero.partida);
        if (cancelado) return;
        setPedidos(datosPedidos);
        setCargando(false);
      } catch (fallo) {
        if (cancelado) return;
        setError(fallo.message ?? 'Error al cargar los pedidos');
        setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [id, intento]);

  const partida = cocinero?.partida ?? null;

  return (
    <Box>
      <Heading size="lg" mb={1}>
        Pedidos pendientes
      </Heading>
      <Text color="gray.600" mb={6}>
        {partida ? `Partida: ${NOMBRES_PARTIDA[partida] ?? partida}` : 'Vista de cocina'}
      </Text>

      {cargando && <Text color="gray.600">Cargando pedidos…</Text>}

      {!cargando && error && (
        <Alert
          status="error"
          borderRadius="md"
          flexDirection="column"
          alignItems="flex-start"
          gap={3}
        >
          <AlertIcon />
          <AlertTitle>No se pudieron cargar los pedidos</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button size="sm" colorScheme="red" onClick={() => setIntento((valor) => valor + 1)}>
            Reintentar
          </Button>
        </Alert>
      )}

      {!cargando && !error && partida === null && <EstadoSinPartida />}

      {!cargando && !error && partida !== null && pedidos.length === 0 && <EstadoVacio />}

      {!cargando && !error && partida !== null && pedidos.length > 0 && (
        <Stack spacing={4}>
          {pedidos.map((pedido) => (
            <PedidoCard key={pedido.id} pedido={pedido} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
