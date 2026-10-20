import { Box, Heading, Stack, Text } from '@chakra-ui/react';
import EstadoSinPartida from '../components/EstadoSinPartida.jsx';
import EstadoVacio from '../components/EstadoVacio.jsx';
import PedidoCard from '../components/PedidoCard.jsx';

const NOMBRES_PARTIDA = {
  entrantes: 'Entrantes',
  principales: 'Principales',
  postres: 'Postres',
};

export default function CocinaPage({ partida = null, pedidos = [] }) {
  return (
    <Box>
      <Heading size="lg" mb={1}>
        Pedidos pendientes
      </Heading>
      <Text color="gray.600" mb={6}>
        {partida ? `Partida: ${NOMBRES_PARTIDA[partida] ?? partida}` : 'Vista de cocina'}
      </Text>

      {partida === null && <EstadoSinPartida />}

      {partida !== null && pedidos.length === 0 && <EstadoVacio />}

      {partida !== null && pedidos.length > 0 && (
        <Stack spacing={4}>
          {pedidos.map((pedido) => (
            <PedidoCard key={pedido.id} pedido={pedido} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
