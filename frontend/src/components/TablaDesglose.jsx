import { Box, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { formatearEuros } from '../utils/format.js';

export default function TablaDesglose({
  titulo,
  encabezados,
  filas,
  renderFila,
}) {
  return (
    <Box mt={8}>
      <Box fontWeight="semibold" mb={2}>
        {titulo}
      </Box>
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              {encabezados.map((encabezado) => (
                <Th key={encabezado}>{encabezado}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {filas.map((fila, indice) => (
              <Tr key={fila.id || fila.camareroId || fila.platoId || indice}>
                {renderFila ? renderFila(fila) : null}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function formatearImporteEuros(valor) {
  return formatearEuros(Math.round((valor || 0) * 100));
}
