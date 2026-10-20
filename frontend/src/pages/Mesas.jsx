import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
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
import { useCallback, useEffect, useState } from 'react';
import Pedido from '../components/Pedido.jsx';
import SelectorPlatos from '../components/SelectorPlatos.jsx';
import { apiEnviar, apiGet } from '../services/api.js';

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [pedido, setPedido] = useState(null);
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);

  const cargarMesas = useCallback(async () => {
    const datos = await apiGet('/mesas');
    setMesas(datos);
    return datos;
  }, []);

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const [datosMesas, datosPlatos] = await Promise.all([apiGet('/mesas'), apiGet('/platos')]);
        if (!activo) return;
        setMesas(datosMesas);
        setPlatos(datosPlatos);
      } catch {
        if (activo) {
          setAviso({ tipo: 'error', texto: 'No se pudo cargar la sala. Revisa la conexión.' });
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  const mesaSeleccionada = mesas.find((mesa) => mesa.id === mesaSeleccionadaId) ?? null;
  const puedeEditar = Boolean(pedido && pedido.estado === 'en_curso');

  function mostrarError(error) {
    setAviso({
      tipo: 'error',
      texto: error?.message || 'No se pudo completar la operación.',
    });
  }

  async function seleccionarMesa(mesa) {
    setAviso(null);
    setMesaSeleccionadaId(mesa.id);

    if (!mesa.pedido_en_curso_id) {
      setPedido(null);
      return;
    }

    try {
      setPedido(await apiGet(`/pedidos/${mesa.pedido_en_curso_id}`));
    } catch (error) {
      mostrarError(error);
    }
  }

  async function abrirMesaSeleccionada() {
    if (!mesaSeleccionada) return;

    try {
      const nuevo = await apiEnviar(`/mesas/${mesaSeleccionada.id}/abrir`, 'POST');
      setPedido(nuevo);
      await cargarMesas();
      setAviso({
        tipo: 'success',
        texto: `${mesaSeleccionada.identificador} abierta. Ya puedes añadir platos.`,
      });
    } catch (error) {
      mostrarError(error);
    }
  }

  async function recargarPedido() {
    if (!pedido) return;
    setPedido(await apiGet(`/pedidos/${pedido.id}`));
  }

  async function anadirPlato(platoId, cantidad) {
    if (!pedido) return;

    try {
      await apiEnviar(`/pedidos/${pedido.id}/lineas`, 'POST', {
        plato_id: platoId,
        cantidad,
      });
      await recargarPedido();
    } catch (error) {
      mostrarError(error);
    }
  }

  async function cambiarCantidad(lineaId, cantidad) {
    if (!pedido) return;

    try {
      await apiEnviar(`/pedidos/${pedido.id}/lineas/${lineaId}`, 'PATCH', { cantidad });
      await recargarPedido();
    } catch (error) {
      mostrarError(error);
    }
  }

  async function quitarLinea(lineaId) {
    if (!pedido) return;

    try {
      await apiEnviar(`/pedidos/${pedido.id}/lineas/${lineaId}`, 'DELETE');
      await recargarPedido();
    } catch (error) {
      mostrarError(error);
    }
  }

  async function confirmar() {
    if (!pedido) return;

    try {
      await apiEnviar(`/pedidos/${pedido.id}/confirmar`, 'POST');
      await recargarPedido();
      await cargarMesas();
      setAviso({ tipo: 'success', texto: 'Pedido confirmado y enviado a cocina.' });
    } catch (error) {
      mostrarError(error);
    }
  }

  if (cargando) {
    return (
      <Flex justify="center" py={16}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg">Sala</Heading>
        <Text color="gray.600" mt={1}>
          Abre una mesa, toma la comanda plato a plato y confírmala cuando el cliente haya terminado
          de pedir.
        </Text>
      </Box>

      {aviso && (
        <Alert status={aviso.tipo} borderRadius="md">
          <AlertIcon />
          <AlertDescription>{aviso.texto}</AlertDescription>
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
        <Stack spacing={6}>
          <Box>
            <Heading size="md" mb={3}>
              Mesas
            </Heading>
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
              {mesas.map((mesa) => (
                <Button
                  key={mesa.id}
                  variant={mesaSeleccionadaId === mesa.id ? 'solid' : 'outline'}
                  colorScheme={mesaSeleccionadaId === mesa.id ? 'teal' : 'gray'}
                  height="auto"
                  py={3}
                  whiteSpace="normal"
                  onClick={() => seleccionarMesa(mesa)}
                >
                  <Stack spacing={1} align="center">
                    <Text fontWeight="semibold">{mesa.identificador}</Text>
                    <Badge colorScheme={mesa.estado === 'libre' ? 'green' : 'orange'}>
                      {mesa.estado === 'libre' ? 'Libre' : 'Ocupada'}
                    </Badge>
                  </Stack>
                </Button>
              ))}
            </SimpleGrid>

            {mesaSeleccionada && !pedido && mesaSeleccionada.estado !== 'ocupada' && (
              <Button mt={4} colorScheme="teal" onClick={abrirMesaSeleccionada}>
                Abrir {mesaSeleccionada.identificador}
              </Button>
            )}
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Carta
            </Heading>
            <Card>
              <CardBody>
                <SelectorPlatos platos={platos} puedeEditar={puedeEditar} onAnadir={anadirPlato} />
              </CardBody>
            </Card>
          </Box>
        </Stack>

        <Box>
          {pedido ? (
            <Pedido
              pedido={pedido}
              mesa={mesaSeleccionada}
              enLinea
              onCambiarCantidad={cambiarCantidad}
              onRetirarLinea={quitarLinea}
              onConfirmar={confirmar}
            />
          ) : (
            <Card>
              <CardBody>
                <Heading size="sm" mb={2}>
                  Sin pedido abierto
                </Heading>
                <Text color="gray.600" fontSize="sm">
                  Selecciona una mesa ocupada para ver su comanda o abre una mesa libre para empezar
                  a tomar el pedido.
                </Text>
              </CardBody>
            </Card>
          )}
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
