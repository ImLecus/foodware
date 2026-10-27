import { Badge } from '@chakra-ui/react';

export default function PlatoEstado({ estado }) {
  const esListo = estado === 'listo';

  return (
    <Badge colorScheme={esListo ? 'green' : 'orange'} variant={esListo ? 'solid' : 'subtle'}>
      {esListo ? 'Listo' : 'Pendiente'}
    </Badge>
  );
}
