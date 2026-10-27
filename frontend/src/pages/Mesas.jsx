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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditorPedido from '../components/EditorPedido.jsx';
import Pedido from '../components/Pedido.jsx';
import SelectorPlatos from '../components/SelectorPlatos.jsx';
import {
  abrirMesa,
  anadirLinea,
  anularPedido,
  confirmarPedido,
  listarMesas,
  listarPlatos,
  modificarLinea,
  obtenerPedido,
  retirarLinea,
} from '../services/api.js';
import { crearConexionEventos } from '../services/realtime.js';

export default function Mesas() {
  const navigate = useNavigate();
  const [mesas, setMesas] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [pedido, setPedido] = useState(null);
  const [mesaSeleccionadaId, setMesaSeleccionadaId] = useState(null);
  const [editando, setEditando] = useState(false);
  const [enLinea, setEnLinea] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);

  const pedidoIdRef = useRef(null);
  useEffect(() => {
    pedidoIdRef.current = pedido?.id ?? null;
  }, [pedido]);

  const cargarMesas = useCallback(async () => {
    const datos = await listarMesas();
    setMesas(datos);
    return datos;
  }, []);

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const [datosMesas, datosPlatos] = await Promise.all([listarMesas(), listarPlatos()]);
        if (!activo) return;
        setMesas(datosMesas);
        setPlatos(datosPlatos);
      } catch (error) {
        if (activo) {
          setAviso({
            tipo: 'error',
            texto: error?.message
              ? `No se pudo cargar la sala: ${error.message}`
              : 'No se pudo cargar la sala. Revisa la conexión.',
          });
        }
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (typeof EventSource === 'undefined') {
      return undefined;
    }

    const conexion = crearConexionEventos();
    const alConectar = () => setEnLinea(true);
    const alFallar = () => setEnLinea(false);
    const alCambiar = async () => {
      try {
        await cargarMesas();
      } catch {
        // Si falla la recarga se mantiene el estado actual en pantalla.
      }

      const pedidoId = pedidoIdRef.current;
      if (!pedidoId) return;

      try {
        setPedido(await obtenerPedido(pedidoId));
      } catch {
        setPedido(null);
      }
    };

    conexion.addEventListener('open', alConectar);
    conexion.addEventListener('error', alFallar);
    conexion.addEventListener('pedido-confirmado', alCambiar);
    conexion.addEventListener('pedido-anulado', alCambiar);
    conexion.addEventListener('pedido-modificado', alCambiar);
    conexion.addEventListener('mesa-cerrada', alCambiar);

    return () => {
      conexion.removeEventListener('open', alConectar);
      conexion.removeEventListener('error', alFallar);
      conexion.removeEventListener('pedido-confirmado', alCambiar);
      conexion.removeEventListener('pedido-anulado', alCambiar);
      conexion.removeEventListener('pedido-modificado', alCambiar);
      conexion.removeEventListener('mesa-cerrada', alCambiar);
      conexion.close();
    };
  }, [cargarMesas]);

  const mesaSeleccionada = mesas.find((mesa) => mesa.id === mesaSeleccionadaId) ?? null;
  // Las mesas cerradas dejan de mostrarse en la vista de sala (FR-011).
  const mesasVisibles = mesas.filter((mesa) => mesa.estado !== 'cerrada');
  const puedeEditar = Boolean(pedido && pedido.estado === 'en_curso' && enLinea);

  function mostrarError(error) {
    setAviso({
      tipo: 'error',
      texto: error?.message || 'No se pudo completar la operación.',
    });
  }

  async function seleccionarMesa(mesa) {
    setAviso(null);
    setEditando(false);
    setMesaSeleccionadaId(mesa.id);

    const pedidoId = mesa.pedido_en_curso_id ?? mesa.pedido_enviado_id;
    if (!pedidoId) {
      setPedido(null);
      return;
    }

    try {
      setPedido(await obtenerPedido(pedidoId));
    } catch (error) {
      mostrarError(error);
    }
  }

  async function abrirMesaSeleccionada() {
    if (!mesaSeleccionada) return;

    try {
      const nuevo = await abrirMesa(mesaSeleccionada.id);
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
    setPedido(await obtenerPedido(pedido.id));
  }

  async function anadirPlato(platoId, cantidad) {
    if (!pedido) return;

    try {
      await anadirLinea(pedido.id, platoId, cantidad);
      await recargarPedido();
    } catch (error) {
      mostrarError(error);
    }
  }

  async function cambiarCantidad(lineaId, cantidad) {
    if (!pedido) return;

    try {
      await modificarLinea(pedido.id, lineaId, { cantidad });
      await recargarPedido();
    } catch (error) {
      mostrarError(error);
    }
  }

  async function quitarLinea(lineaId) {
    if (!pedido) return;

    try {
      await retirarLinea(pedido.id, lineaId);
      await recargarPedido();
    } catch (error) {
      mostrarError(error);
    }
  }

  async function confirmar() {
    if (!pedido) return;

    try {
      await confirmarPedido(pedido.id);
      await recargarPedido();
      await cargarMesas();
      setAviso({ tipo: 'success', texto: 'Pedido confirmado y enviado a cocina.' });
    } catch (error) {
      mostrarError(error);
    }
  }

  async function anular() {
    if (!pedido) return;

    try {
      await anularPedido(pedido.id);
      setPedido(null);
      await cargarMesas();
      setAviso({ tipo: 'info', texto: 'Pedido anulado. La mesa vuelve a estar libre.' });
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

      {!enLinea && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <AlertDescription>
            Sin conexión. No se pueden confirmar ni modificar pedidos; lo anotado se conserva en
            pantalla hasta recuperar la conexión.
          </AlertDescription>
        </Alert>
      )}

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
            {mesasVisibles.length === 0 && (
              <Alert status="info" borderRadius="md" mb={3}>
                <AlertIcon />
                <AlertDescription>
                  {mesas.length === 0 ? (
                    <>
                      No hay mesas cargadas. Ejecuta los datos de ejemplo con{' '}
                      <code>npm run seed</code> en el backend.
                    </>
                  ) : (
                    'No hay mesas abiertas: todas están cerradas.'
                  )}
                </AlertDescription>
              </Alert>
            )}
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
              {mesasVisibles.map((mesa) => (
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
            pedido.estado === 'enviada' && editando ? (
              <EditorPedido
                pedidoId={pedido.id}
                mesa={mesaSeleccionada}
                enLinea={enLinea}
                onCerrar={() => {
                  setEditando(false);
                  recargarPedido();
                }}
                onActualizado={(actualizado) => {
                  if (actualizado) setPedido(actualizado);
                }}
              />
            ) : (
              <Stack spacing={3}>
                <Button
                  colorScheme="teal"
                  variant="outline"
                  onClick={() =>
                    navigate(`/cuentas?mesa=${encodeURIComponent(mesaSeleccionadaId)}`)
                  }
                >
                  Cobrar cuenta
                </Button>
                {pedido.estado === 'enviada' && (
                  <Button
                    colorScheme="purple"
                    isDisabled={!enLinea}
                    onClick={() => setEditando(true)}
                  >
                    Editar pedido
                  </Button>
                )}
                <Pedido
                  pedido={pedido}
                  mesa={mesaSeleccionada}
                  enLinea={enLinea}
                  onCambiarCantidad={cambiarCantidad}
                  onRetirarLinea={quitarLinea}
                  onConfirmar={confirmar}
                  onAnular={anular}
                />
              </Stack>
            )
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
