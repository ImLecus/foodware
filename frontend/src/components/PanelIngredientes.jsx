import { Badge, Box, Button, Heading, Stack, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';

export default function PanelIngredientes({ ingredientes = [], onCrear, onEditar, onCambiarEstado }) {
  return (
    <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Heading size="md">Ingredientes</Heading>
        {onCrear ? (
          <Button size="sm" onClick={onCrear}>
            Nuevo ingrediente
          </Button>
        ) : null}
      </Stack>
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            <Th>Nombre</Th>
            <Th>Estado</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {ingredientes.map((ing) => (
            <Tr key={ing.id}>
              <Td>{ing.nombre}</Td>
              <Td>
                <Badge colorScheme={ing.estado === 'disponible' ? 'green' : 'red'}>{ing.estado}</Badge>
              </Td>
              <Td>
                <Stack direction="row" spacing={2}>
                  {onEditar ? (
                    <Button size="xs" onClick={() => onEditar(ing)}>
                      Editar
                    </Button>
                  ) : null}
                  {onCambiarEstado ? (
                    <Button
                      size="xs"
                      onClick={() => onCambiarEstado(ing, ing.estado === 'disponible' ? 'agotado' : 'disponible')}
                    >
                      {ing.estado === 'disponible' ? 'Marcar agotado' : 'Marcar disponible'}
                    </Button>
                  ) : null}
                </Stack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
