import { Alert, AlertIcon, Box, Heading, Spinner, Stack, Td, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { formatearEuros, formatearFechaLarga } from '../utils/format.js';
import { obtenerInformeDiario } from '../services/reports.js';
import IndicadorTendencia from '../components/IndicadorTendencia.jsx';
import TablaDesglose from '../components/TablaDesglose.jsx';

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

      {informe.comparacion ? (
        <Box mb={8} p={4} bg="gray.50" borderRadius="md">
          <Heading size="md" mb={2}>
            Comparación con el día anterior
          </Heading>
          {informe.comparacion.diaAnterior === null ? (
            <Text color="gray.600">Sin datos anteriores para comparar</Text>
          ) : (
            <>
              <Text mb={2}>
                Día actual: {formatearEuros(Math.round((informe.comparacion.importeActual || 0) * 100))} ·
                Día anterior: {formatearEuros(Math.round((informe.comparacion.importeAnterior || 0) * 100))}
              </Text>
              <Text mb={2}>
                Diferencia:{' '}
                {informe.comparacion.sinBaseComparacion
                  ? `${formatearEuros(Math.round(Math.abs(informe.comparacion.diferenciaImporte || 0) * 100))} (sin base de comparación)`
                  : `${informe.comparacion.diferenciaImporte >= 0 ? '+' : ''}${formatearEuros(Math.round((informe.comparacion.diferenciaImporte || 0) * 100))}`}
              </Text>
              <IndicadorTendencia
                tendencia={informe.comparacion.tendencia}
                diferenciaPorcentaje={informe.comparacion.diferenciaPorcentaje}
                sinBaseComparacion={informe.comparacion.sinBaseComparacion}
              />
            </>
          )}
        </Box>
      ) : null}

      {Array.isArray(informe.porCamarero) && informe.porCamarero.length > 0 ? (
        <TablaDesglose
          titulo="Ventas por camarero"
          encabezados={['Camarero', 'Cuentas', 'Importe']}
          filas={informe.porCamarero}
          renderFila={(fila) => (
            <>
              <Td>{fila.nombre || fila.camareroId}</Td>
              <Td isNumeric>{fila.numeroCuentas}</Td>
              <Td isNumeric>{formatearEuros(Math.round((fila.importe || 0) * 100))}</Td>
            </>
          )}
        />
      ) : null}

      {Array.isArray(informe.porPlato) && informe.porPlato.length > 0 ? (
        <TablaDesglose
          titulo="Ventas por plato"
          encabezados={['Plato', 'Partida', 'Cantidad', 'Importe']}
          filas={informe.porPlato}
          renderFila={(fila) => (
            <>
              <Td>{fila.nombre || fila.platoId}</Td>
              <Td>{fila.partida || ''}</Td>
              <Td isNumeric>{fila.cantidad || 0}</Td>
              <Td isNumeric>{formatearEuros(Math.round((fila.importe || 0) * 100))}</Td>
            </>
          )}
        />
      ) : null}
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
