import { Alert, AlertIcon, Box, Heading, Spinner, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { formatearEuros, formatearFechaLarga } from '../utils/format.js';
import { obtenerInformeDiario } from '../services/reports.js';

function EstadoCargando() {
  return (
    <Stack align="center" justify="center" py={16} spacing={4}>
      <Spinner size="lg" color="teal.500" />
      <Text color="gray.600">Cargando informe...</Text>
    </Stack>
  );
}

function EstadoSinPermiso() {
  return (
    <Alert status="error">
      <AlertIcon />
      Acceso restringido al encargado.
    </Alert>
  );
}

function EstadoSinConexion() {
  return (
    <Alert status="warning">
      <AlertIcon />
      Sin conexión. No se ha podido cargar el informe del día.
    </Alert>
  );
}

function EstadoSinVentas({ fecha }) {
  return (
    <Box>
      <Heading size="lg" mb={2}>
        Dashboard de estadísticas
      </Heading>
      <Text color="gray.600" mb={6}>
        {formatearFechaLarga(fecha)}
      </Text>
      <Alert status="info">
        <AlertIcon />
        No hay ventas registradas para este día.
      </Alert>
      <Box mt={8}>
        <Text fontSize="sm" color="gray.500">
          Total del día
        </Text>
        <Heading size="2xl">{formatearEuros(0)}</Heading>
      </Box>
    </Box>
  );
}

function EstadoDatos({ informe }) {
  return (
    <Box>
      <Heading size="lg" mb={2}>
        Dashboard de estadísticas
      </Heading>
      <Text color="gray.600" mb={6}>
        {formatearFechaLarga(informe.fecha)}
      </Text>
      <Box mb={8}>
        <Text fontSize="sm" color="gray.500">
          Total del día
        </Text>
        <Heading size="2xl">{formatearEuros(Math.round(informe.totalVendido * 100))}</Heading>
        <Text color="gray.600" mt={1}>
          {informe.numeroCuentas} cuenta{informe.numeroCuentas === 1 ? '' : 's'} cerrada
          {informe.numeroCuentas === 1 ? '' : 's'}
        </Text>
      </Box>
    </Box>
  );
}

export default function PaginaDashboard() {
  const [estado, setEstado] = useState('cargando');
  const [informe, setInforme] = useState(null);

  useEffect(() => {
    let activo = true;
    obtenerInformeDiario()
      .then((datos) => {
        if (!activo) return;
        setInforme(datos);
        setEstado('datos');
      })
      .catch((error) => {
        if (!activo) return;
        if (error?.status === 401 || error?.status === 403) {
          setEstado('sin-permiso');
          return;
        }
        setEstado('sin-conexion');
      });
    return () => {
      activo = false;
    };
  }, []);

  if (estado === 'cargando') {
    return <EstadoCargando />;
  }
  if (estado === 'sin-permiso') {
    return <EstadoSinPermiso />;
  }
  if (estado === 'sin-conexion') {
    return <EstadoSinConexion />;
  }
  if (estado === 'datos' && informe && informe.totalVendido === 0 && informe.numeroCuentas === 0) {
    return <EstadoSinVentas fecha={informe.fecha} />;
  }
  if (estado === 'datos' && informe) {
    return <EstadoDatos informe={informe} />;
  }

  return <EstadoSinConexion />;
}
