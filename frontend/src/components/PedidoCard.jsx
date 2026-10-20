import { Box, Card, CardBody, Heading, ListItem, Text, UnorderedList } from '@chakra-ui/react';

export default function PedidoCard({ pedido }) {
  return (
    <Card data-testid={`pedido-${pedido.id}`}>
      <CardBody>
        <Heading size="sm" mb={2}>
          Mesa {pedido.mesa}
        </Heading>
        <UnorderedList spacing={1} fontSize="sm">
          {pedido.lineas.map((linea) => (
            <ListItem key={linea.id}>
              {linea.nombrePlato} × {linea.cantidad}
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
