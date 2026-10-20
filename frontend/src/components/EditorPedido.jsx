import {
  Alert,
  AlertDescription,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Input,
  NumberInput,
  NumberInputField,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  abrirEdicion,
  anadirLinea,
  cerrarEdicion,
  enviarCambios,
  listarPlatos,
  modificarLinea,
  obtenerPedido,
  retirarLinea,
} from '../services/api.js';
import { formatearEuros } from '../utils/formato.js';
import { agruparPorPartida, NOMBRES_PARTIDA, PARTIDAS } from '../utils/partidas.js';
import EnviarCambios from './EnviarCambios.jsx';
import SelectorPlatos from './SelectorPlatos.jsx';

export default function EditorPedido({ pedidoId, mesa, enLinea = true, onCerrar, onActualizado }) {
  const [pedido, setPedido] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const [datosPedido, datosPlatos] = await Promise.all([
          obtenerPedido(pedidoId),
          listarPlatos(),
        ]);
        if (!activo) return;
        setPedido(datosPedido);
        setPlatos(datosPlatos);
        await abrirEdicion(pedidoId);
      } catch (error) {
        if (activo) manejarError(error);
      } finally {
        if (activo) setCargando(false);
      }
    })();

    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  function manejarError(error) {
    if (error?.status === 423 || error?.codigo === 'pedido_bloqueado') {
      setAviso({
        tipo: 'error',
        bloqueado: true,
        texto: 'El pedido está bloqueado por otro camarero.',
      });
      return;
    }

    setAviso({ tipo: 'error', texto: error?.message || 'No se pudo completar la operación.' });
  }

  async function recargar() {
    const actualizado = await obtenerPedido(pedidoId);
    setPedido(actualizado);
    onActualizado?.(actualizado);
    return actualizado;
  }

  async function anadirPlato(platoId, cantidad) {
    try {
      await anadirLinea(pedidoId, platoId, cantidad);
      await recargar();
    } catch (error) {
      manejarError(error);
    }
  }

  async function cambiarCantidad(lineaId, cantidad) {
    try {
      await modificarLinea(pedidoId, lineaId, { cantidad });
      await recargar();
    } catch (error) {
      manejarError(error);
    }
  }

  async function cambiarIndicaciones(lineaId, indicaciones) {
    try {
      await modificarLinea(pedidoId, lineaId, { indicaciones: indicaciones || null });
      await recargar();
    } catch (error) {
      manejarError(error);
    }
  }

  async function quitarLinea(lineaId) {
    try {
      await retirarLinea(pedidoId, lineaId);
      await recargar();
    } catch (error) {
      manejarError(error);
    }
  }

  async function cancelar() {
    try {
      await cerrarEdicion(pedidoId);
    } catch {
      // La salida del editor no debe bloquearse aunque falle la liberación.
    }
    onCerrar?.();
  }

  async function enviar() {
    try {
      await enviarCambios(pedidoId);
      onActualizado?.();
      onCerrar?.();
    } catch (error) {
      manejarError(error);
    }
  }

  if (cargando) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (aviso?.bloqueado) {
    return (
      <Card>
        <CardBody>
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            <AlertDescription>{aviso.texto}</AlertDescription>
          </Alert>
          <Button onClick={() => onCerrar?.()}>Volver</Button>
        </CardBody>
      </Card>
    );
  }

  if (!pedido) {
    return (
      <Card>
        <CardBody>
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            <AlertDescription>{aviso?.texto ?? 'No se pudo cargar el pedido.'}</AlertDescription>
          </Alert>
          <Button onClick={() => onCerrar?.()}>Volver</Button>
        </CardBody>
      </Card>
    );
  }

  const lineas = pedido.lineas ?? [];
  const porPartida = pedido.por_partida ?? agruparPorPartida(lineas);
  const editable = enLinea;
  const total = lineas.reduce((suma, linea) => suma + linea.cantidad * linea.precio_centimos, 0);

  return (
    <Card>
      <CardHeader>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Heading size="md">Editar pedido · {mesa?.identificador ?? 'Mesa'}</Heading>
          <Flex gap={2}>
            {pedido.modificada && <Badge colorScheme="purple">Modificada</Badge>}
            {pedido.cambios_pendientes && <Badge colorScheme="orange">Cambios pendientes</Badge>}
          </Flex>
        </Flex>
      </CardHeader>

      <CardBody>
        {!enLinea && (
          <Alert status="warning" borderRadius="md" mb={4}>
            <AlertIcon />
            <AlertDescription>
              Sin conexión. No se pueden guardar ni enviar cambios; lo escrito se conserva en
              pantalla.
            </AlertDescription>
          </Alert>
        )}

        {aviso && (
          <Alert status={aviso.tipo} borderRadius="md" mb={4}>
            <AlertIcon />
            <AlertDescription>{aviso.texto}</AlertDescription>
          </Alert>
        )}

        {PARTIDAS.map((partida) => (
          <Box key={partida} mb={4}>
            <Heading size="sm" mb={2}>
              {NOMBRES_PARTIDA[partida]}
            </Heading>
            {(porPartida[partida] ?? []).length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                Sin platos
              </Text>
            ) : (
              porPartida[partida].map((linea) => (
                <Box key={linea.id} py={3} borderBottomWidth="1px" borderColor="gray.100">
                  <Flex align="center" gap={3} wrap="wrap">
                    <Text flex="1" minW="140px">
                      {linea.plato_nombre}
                    </Text>
                    <NumberInput
                      value={linea.cantidad}
                      min={1}
                      max={99}
                      size="sm"
                      maxW="90px"
                      isDisabled={!editable}
                      onChange={(valor) => {
                        const cantidad = Number(valor);
                        if (Number.isInteger(cantidad) && cantidad >= 1) {
                          cambiarCantidad(linea.id, cantidad);
                        }
                      }}
                    >
                      <NumberInputField aria-label={`Cantidad de ${linea.plato_nombre}`} />
                    </NumberInput>
                    <Text fontSize="sm" color="gray.600" minW="70px" textAlign="right">
                      {formatearEuros(linea.precio_centimos)}
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      isDisabled={!editable || lineas.length <= 1}
                      onClick={() => quitarLinea(linea.id)}
                    >
                      Quitar
                    </Button>
                  </Flex>
                  <Input
                    mt={2}
                    size="sm"
                    defaultValue={linea.indicaciones ?? ''}
                    placeholder="Indicaciones (sin sal, sin cebolla…)"
                    aria-label={`Indicaciones de ${linea.plato_nombre}`}
                    isDisabled={!editable}
                    onBlur={(evento) => {
                      const valor = evento.target.value.trim();
                      if (valor !== (linea.indicaciones ?? '')) {
                        cambiarIndicaciones(linea.id, valor);
                      }
                    }}
                  />
                </Box>
              ))
            )}
          </Box>
        ))}

        <Flex justify="space-between" pt={2} fontWeight="bold">
          <Text>Total</Text>
          <Text>{formatearEuros(total)}</Text>
        </Flex>

        <Box mt={6}>
          <Heading size="sm" mb={2}>
            Añadir platos
          </Heading>
          <SelectorPlatos platos={platos} puedeEditar={editable} onAnadir={anadirPlato} />
        </Box>
      </CardBody>

      <CardFooter gap={3} flexWrap="wrap">
        <Button variant="outline" onClick={cancelar}>
          Cancelar edición
        </Button>
        <EnviarCambios
          cambiosPendientes={pedido.cambios_pendientes}
          enLinea={enLinea}
          onEnviar={enviar}
        />
      </CardFooter>
    </Card>
  );
}
