import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import DivisionCuenta from '../components/DivisionCuenta.jsx';
import ParteCuenta from '../components/ParteCuenta.jsx';
import ResumenCuenta from '../components/ResumenCuenta.jsx';
import TicketFinal from '../components/TicketFinal.jsx';
import { useCuenta } from '../hooks/useCuenta.js';
import { listarMesas } from '../services/api.js';
import { formatearEuros } from '../utils/formato.js';

/** Página de cierre: elige una mesa, revisa el total y cobra la cuenta. */
export default function CierreCuenta() {
  const [parametros, setParametros] = useSearchParams();
  const mesaId = parametros.get('mesa');
  const [mesas, setMesas] = useState([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [errorMesas, setErrorMesas] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [aviso, setAviso] = useState(null);

  const {
    cuenta,
    cargando,
    error,
    sinConexion,
    cerrando,
    confirmandoDivision,
    pagandoParteId,
    ticket: ticketPartes,
    ticketEstado,
    cerrar,
    dividir,
    pagarParte,
    deshacerPago,
  } = useCuenta(mesaId);

  useEffect(() => {
    setTicket(null);
    setAviso(null);
  }, [mesaId]);

  useEffect(() => {
    if (mesaId) return undefined;

    let activo = true;
    setCargandoMesas(true);

    (async () => {
      try {
        const datos = await listarMesas();
        if (activo) {
          setMesas(datos.filter((mesa) => mesa.estado !== 'cerrada'));
          setErrorMesas(null);
        }
      } catch (err) {
        if (activo) setErrorMesas(err);
      } finally {
        if (activo) setCargandoMesas(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [mesaId]);

  async function confirmar() {
    try {
      const resultado = await cerrar();
      setTicket(resultado?.ticket ?? null);
      setAviso({
        tipo: 'success',
        texto: `Cuenta cerrada y ticket emitido por ${formatearEuros(
          resultado?.ticket?.total_centimos ?? 0,
        )}.`,
      });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message || 'No se pudo cerrar la cuenta.' });
    }
  }

  function cancelar() {
    setTicket(null);
    setAviso(null);
    setParametros({});
  }

  async function confirmarDivision(datos) {
    try {
      await dividir(datos);
      setAviso({ tipo: 'success', texto: 'División confirmada. Ya puedes cobrar cada parte.' });
    } catch {
      // El error de la API se muestra en el aviso superior.
    }
  }

  async function cobrarParte(parteId) {
    try {
      await pagarParte(parteId);
      setAviso(null);
    } catch {
      // El error de la API se muestra en el aviso superior.
    }
  }

  async function deshacerParte(parteId) {
    try {
      await deshacerPago(parteId);
      setAviso(null);
    } catch {
      // El error de la API se muestra en el aviso superior.
    }
  }

  const puedeCobrar =
    Boolean(cuenta) &&
    !cuenta.division &&
    !cargando &&
    !sinConexion &&
    !cerrando &&
    cuenta.estado !== 'cerrada' &&
    cuenta.total_centimos > 0;

  // Mesa ya cerrada: no hay cuenta abierta, pero sí un ticket que se puede re-mostrar.
  const ticketSinCuenta = Boolean(ticketPartes && !cuenta);

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">Cierre de cuenta</Heading>
        <Text color="gray.600" mt={1}>
          Revisa el total calculado con el precio fijado al pedir y confirma el cobro.
        </Text>
      </Box>

      {!mesaId && (
        <Box>
          <Heading size="md" mb={3}>
            Elige una mesa
          </Heading>

          {cargandoMesas && (
            <Flex align="center" gap={3}>
              <Spinner />
              <Text color="gray.600">Cargando las mesas…</Text>
            </Flex>
          )}

          {!cargandoMesas && errorMesas && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                No se pudieron cargar las mesas. Revisa la conexión.
              </AlertDescription>
            </Alert>
          )}

          {!cargandoMesas && !errorMesas && mesas.length === 0 && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <AlertDescription>No hay mesas abiertas para cobrar.</AlertDescription>
            </Alert>
          )}

          {!cargandoMesas && !errorMesas && mesas.length > 0 && (
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
              {mesas.map((mesa) => (
                <Button
                  key={mesa.id}
                  variant="outline"
                  height="auto"
                  py={3}
                  whiteSpace="normal"
                  onClick={() => setParametros({ mesa: mesa.id })}
                >
                  {mesa.identificador}
                </Button>
              ))}
            </SimpleGrid>
          )}
        </Box>
      )}

      {mesaId && sinConexion && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            Sin conexión. No se puede confirmar el cierre; la cuenta se conserva en pantalla
            hasta recuperar la conexión.
          </AlertDescription>
        </Alert>
      )}

      {mesaId && !sinConexion && error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {aviso && (
        <Alert status={aviso.tipo} borderRadius="md">
          <AlertIcon />
          <AlertDescription>{aviso.texto}</AlertDescription>
        </Alert>
      )}

      {mesaId && ticketSinCuenta && (
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center" mb={4} gap={4}>
              <Heading size="md">{ticketPartes.identificador ?? 'Ticket final'}</Heading>
              <Button size="sm" variant="ghost" onClick={cancelar}>
                Volver
              </Button>
            </Flex>
            <Text color="gray.600" mb={4}>
              La mesa ya está cerrada. Este es el ticket final de su cuenta.
            </Text>
            <TicketFinal ticket={ticketPartes} ticketEstado="emitido" hayDivision />
          </CardBody>
        </Card>
      )}

      {mesaId && !ticketSinCuenta && (
        <Card>
          <CardBody>
            <Flex justify="space-between" align="center" mb={4} gap={4}>
              <Heading size="md">
                {cuenta?.identificador ?? 'Cuenta de la mesa'}
              </Heading>
              <Button size="sm" variant="ghost" onClick={cancelar}>
                Cancelar
              </Button>
            </Flex>

            <ResumenCuenta cuenta={cuenta} cargando={cargando} />

            {!cargando && cuenta && !cuenta.division && (
              <Box mt={4}>
                <DivisionCuenta
                  cuenta={cuenta}
                  onConfirmar={confirmarDivision}
                  confirmando={confirmandoDivision}
                  deshabilitado={sinConexion}
                />
              </Box>
            )}

            {!cargando && cuenta?.division && (
              <Box mt={4}>
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>
                    Cuenta dividida en {cuenta.division.partes.length}{' '}
                    {cuenta.division.partes.length === 1 ? 'parte' : 'partes'} con{' '}
                    {cuenta.division.modo === 'iguales'
                      ? 'partes iguales'
                      : 'consumos asignados'}
                    .{' '}
                    {cuenta.estado === 'cerrada'
                      ? 'La mesa está cerrada y este es el ticket final.'
                      : 'El cobro se realiza parte a parte.'}
                  </AlertDescription>
                </Alert>

                <Heading size="sm" mt={4} mb={2}>
                  Partes de la cuenta
                </Heading>

                <Stack spacing={2}>
                  {cuenta.division.partes.map((parte) => (
                    <ParteCuenta
                      key={parte.id}
                      parte={parte}
                      editable={false}
                      onPagar={() => cobrarParte(parte.id)}
                      onDeshacer={() => deshacerParte(parte.id)}
                      pagando={pagandoParteId === parte.id}
                      deshabilitado={sinConexion || cuenta.estado === 'cerrada'}
                    />
                  ))}
                </Stack>

                <Box mt={4}>
                  <TicketFinal
                    ticket={ticketPartes}
                    ticketEstado={ticketEstado}
                    hayDivision
                  />
                </Box>
              </Box>
            )}

            {ticket && (
              <Alert status="success" borderRadius="md" mt={4}>
                <AlertIcon />
                <AlertDescription>
                  Ticket emitido con {ticket.partes?.length ?? 0}{' '}
                  {(ticket.partes?.length ?? 0) === 1 ? 'parte' : 'partes'} y un total de{' '}
                  {formatearEuros(ticket.total_centimos)}.
                </AlertDescription>
              </Alert>
            )}

            {!cargando && cuenta && cuenta.total_centimos === 0 && (
              <Text color="gray.600" fontSize="sm" mt={3}>
                No se puede cerrar una cuenta sin consumos.
              </Text>
            )}

            {!cuenta?.division && (
              <Button
                mt={4}
                colorScheme="teal"
                onClick={confirmar}
                isLoading={cerrando}
                isDisabled={!puedeCobrar}
              >
                Confirmar cobro único
              </Button>
            )}
          </CardBody>
        </Card>
      )}
    </Stack>
  );
}
