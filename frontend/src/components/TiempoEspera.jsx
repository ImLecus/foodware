import { Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

function formatearEspera(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

/** Tiempo transcurrido desde el envío original, actualizado con el reloj local. */
export default function TiempoEspera({ enviadoEn }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const minutos = Math.max(0, Math.floor((ahora - new Date(enviadoEn).getTime()) / 60_000));

  return (
    <Text as="span" fontSize="sm" color="gray.700">
      {formatearEspera(minutos)}
    </Text>
  );
}
