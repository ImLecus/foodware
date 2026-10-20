import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import EstadoCarga from '../components/EstadoCarga.jsx';
import EstadoError from '../components/EstadoError.jsx';
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

      {cargando && <EstadoCarga />}

      {!cargando && error && (
        <EstadoError mensaje={error} onReintentar={() => setIntento((valor) => valor + 1)} />
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
