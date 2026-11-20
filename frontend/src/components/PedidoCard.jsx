import {
  Box,
  Card,
  CardBody,
  Flex,
  Heading,
  ListItem,
  Text,
  UnorderedList,
} from '@chakra-ui/react';
import AvisoModificado from './AvisoModificado.jsx';
import LineaPlato from './LineaPlato.jsx';
import TiempoEspera from './TiempoEspera.jsx';

export default function PedidoCard({ pedido, onMarcarListo, onDeshacer, deshabilitado = false }) {
  const accionable = (linea) =>
    !pedido.partida || !linea.partida || linea.partida === pedido.partida;

  return (
    <Card data-testid={`pedido-${pedido.id}`}>
      <CardBody>
        <Flex justify="space-between" align="center" mb={2}>
          <Flex align="center" gap={2}>
            <Heading size="sm">Mesa {pedido.mesa}</Heading>
            {pedido.modificado && <AvisoModificado />}
          </Flex>
          <TiempoEspera enviadoEn={pedido.enviadoEn} />
        </Flex>
        <UnorderedList spacing={1} fontSize="sm">
          {pedido.lineas.map((linea) => (
            <ListItem key={linea.id}>
              <LineaPlato
                linea={linea}
                onMarcarListo={accionable(linea) ? onMarcarListo : undefined}
                onDeshacer={accionable(linea) ? onDeshacer : undefined}
                deshabilitado={deshabilitado}
              />
            </ListItem>
          ))}
        </UnorderedList>
        {pedido.lineas.length === 0 && (
          <Text fontSize="sm" color="gray.600">
            Este pedido no tiene platos.
          </Text>
        )}
        <Box mt={2} fontSize="xs" color="gray.500">
          Pedido {pedido.id}
        </Box>
      </CardBody>
    </Card>
  );
}
