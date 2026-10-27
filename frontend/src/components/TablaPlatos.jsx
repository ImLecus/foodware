import { Table, Thead, Tbody, Tr, Th, Td, Button, Box, Badge } from '@chakra-ui/react';
import { formatearEuros } from '../utils/format.js';

export default function TablaPlatos({ platos = [], onEditar, onCambiarActivo }) {
  const formatearPrecio = (plato) => {
    if (plato.precio_centimos !== undefined && plato.precio_centimos !== null) {
      return formatearEuros(plato.precio_centimos);
    }
    if (typeof plato.precio === 'number') {
      return plato.precio.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
    }
    if (typeof plato.precio === 'string') return plato.precio;
    return '—';
  };

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nombre</Th>
            <Th>Partida</Th>
            <Th>Precio</Th>
            <Th>Activo</Th>
            <Th>Disponibilidad</Th>
            <Th>Acciones</Th>
          </Tr>
        </Thead>
        <Tbody>
          {platos.map((plato) => (
            <Tr key={plato.id}>
              <Td>{plato.nombre}</Td>
              <Td>{plato.partida_codigo || plato.partida}</Td>
              <Td>{formatearPrecio(plato)}</Td>
              <Td>
                <Badge colorScheme={plato.activo ? 'green' : 'red'}>{plato.activo ? 'Sí' : 'No'}</Badge>
              </Td>
              <Td>
                {plato.ofrecible ? (
                  <Badge colorScheme="green">Ofrecible</Badge>
                ) : (
                  <Badge colorScheme="orange">{plato.motivo === 'ingrediente_agotado' ? 'Ingrediente agotado' : 'Desactivado'}</Badge>
                )}
              </Td>
              <Td>
                <Box display="flex" gap={2}>
                  {onEditar ? (
                    <Button size="sm" onClick={() => onEditar(plato)}>
                      Editar
                    </Button>
                  ) : null}
                  {onCambiarActivo ? (
                    <Button size="sm" onClick={() => onCambiarActivo(plato, !plato.activo)}>
                      {plato.activo ? 'Desactivar' : 'Activar'}
                    </Button>
                  ) : null}
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}
