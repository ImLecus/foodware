import { Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { calcularMinutos, formatearEspera } from '../state/tiempoEspera.js';

/** Tiempo transcurrido desde el envío original, actualizado con el reloj local. */
export default function TiempoEspera({ enviadoEn }) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 30_000);
    return () => clearInterval(intervalo);
  }, []);

  const minutos = calcularMinutos(enviadoEn, ahora);

  return (
    <Text as="span" fontSize="sm" color="gray.700">
      {formatearEspera(minutos)}
    </Text>
  );
}
