import { Badge } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { crearConexionEventos } from '../services/realtime.js';

export default function Conexion() {
  const [estado, setEstado] = useState('conectando');

  useEffect(() => {
    if (typeof EventSource === 'undefined') {
      return undefined;
    }

    const conexion = crearConexionEventos();
    const alConectar = () => setEstado('conectado');
    const alFallar = () => setEstado('sin-conexion');

    conexion.addEventListener('open', alConectar);
    conexion.addEventListener('error', alFallar);

    return () => {
      conexion.removeEventListener('open', alConectar);
      conexion.removeEventListener('error', alFallar);
      conexion.close();
    };
  }, []);

  if (estado === 'conectado') {
    return (
      <Badge colorScheme="green" variant="subtle">
        En línea
      </Badge>
    );
  }

  if (estado === 'sin-conexion') {
    return (
      <Badge colorScheme="red" variant="solid">
        Sin conexión
      </Badge>
    );
  }

  return (
    <Badge colorScheme="gray" variant="subtle">
      Conectando…
    </Badge>
  );
}
