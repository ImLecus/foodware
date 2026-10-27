import { Table, Thead, Tbody, Tr, Th, Td, Button, Box } from '@chakra-ui/react';
import { formatearEuros } from '../utils/format.js';

export default function TablaPlatos({ platos = [], onEditar }) {
  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nombre</Th>
            <Th>Partida</Th>
            <Th>Precio</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {platos.map((plato) => (
            <Tr key={plato.id}>
              <Td>{plato.nombre}</Td>
              <Td>{plato.partida_codigo}</Td>
              <Td>{formatearEuros(plato.precio_centimos)}</Td>
              <Td>
                {onEditar ? (
                  <Button size="sm" onClick={() => onEditar(plato)}>
                    Editar
                  </Button>
                ) : null}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
EOF
