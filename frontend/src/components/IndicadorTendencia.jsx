import { Box, Icon, Text } from '@chakra-ui/react';
import { formatearPorcentaje } from '../utils/format.js';

export default function IndicadorTendencia({
  tendencia,
  diferenciaPorcentaje,
  sinBaseComparacion,
  compacto = false,
}) {
  const display = compacto ? 'inline-flex' : 'flex';
  if (tendencia === 'sin_variacion') {
    return (
      <Box display={display} alignItems="center" gap={2}>
        <Text aria-label="sin variación">→</Text>
        <Text>Sin variación</Text>
      </Box>
    );
  }
  if (tendencia === 'subida') {
    return (
      <Box display={display} alignItems="center" gap={2} color="green.600">
        <Text aria-label="subida">▲</Text>
        <Text>Subida</Text>
        {!sinBaseComparacion && diferenciaPorcentaje !== null ? (
          <Text>({diferenciaPorcentaje >= 0 ? '+' : ''}{formatearPorcentaje(diferenciaPorcentaje)})</Text>
        ) : null}
      </Box>
    );
  }
  if (tendencia === 'bajada') {
    return (
      <Box display={display} alignItems="center" gap={2} color="red.600">
        <Text aria-label="bajada">▼</Text>
        <Text>Bajada</Text>
        {!sinBaseComparacion && diferenciaPorcentaje !== null ? (
          <Text>({formatearPorcentaje(diferenciaPorcentaje)})</Text>
        ) : null}
      </Box>
    );
  }
  return <Text>{tendencia}</Text>;
}
