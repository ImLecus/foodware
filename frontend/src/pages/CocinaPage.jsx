import { Alert, AlertDescription, AlertIcon, Box, Heading, Stack, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import AvisoPedidoCompletado from '../components/AvisoPedidoCompletado.jsx';
import AvisoSinConexion from '../components/AvisoSinConexion.jsx';
import EstadoCarga from '../components/EstadoCarga.jsx';
import EstadoError from '../components/EstadoError.jsx';
import EstadoSinPartida from '../components/EstadoSinPartida.jsx';
import EstadoVacio from '../components/EstadoVacio.jsx';
import PedidoCard from '../components/PedidoCard.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { obtenerPedidosPendientes, marcarEstado } from '../services/api.js';
import { suscribirAPartida, EVENTOS_COCINA } from '../services/events.js';

const NOMBRES_PARTIDA = {
  entrantes: 'Entrantes',
  principales: 'Principales',
  postres: 'Postres',
};

export default function CocinaPage() {
  const { usuario } = useAuth();
  const partida = usuario?.partida ?? null;
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(Boolean(partida));
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  const [sinConexion, setSinConexion] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);
  const [avisosCompletados, setAvisosCompletados] = useState([]);

  useEffect(() => {
    let cancelado = false;

    if (!partida) {
      setPedidos([]);
      setCargando(false);
      return undefined;
    }

    async function cargar() {
      setCargando(true);
      setError(null);

      try {
        const datosPedidos = await obtenerPedidosPendientes(partida);
        if (cancelado) return;
        setPedidos(datosPedidos);
        setCargando(false);
      } catch (fallo) {
        if (cancelado) return;
        setError(fallo.message ?? 'Error al cargar los pedidos');
        setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [partida, intento]);

  useEffect(() => {
    if (!partida) return undefined;

    async function refrescar() {
      try {
        const datosPedidos = await obtenerPedidosPendientes(partida);
        setPedidos(datosPedidos);
      } catch {
        // Se conserva la última lista conocida.
      }
    }

    return suscribirAPartida(partida, {
      onEvento: (nombre) => {
        if (EVENTOS_COCINA.includes(nombre)) {
          // pedido.modificado refresca el aviso sin reiniciar el tiempo ni la posición:
          // el tiempo se deriva de enviadoEn y el orden lo fija el backend.
          refrescar();
        }
      },
      onEstadoConexion: (estado) => {
        const desconectado = estado === 'sin-conexion';
        setSinConexion(desconectado);
        if (!desconectado) {
          refrescar();
        }
      },
    });
  }, [partida]);

  async function cambiarEstado(pedido, linea, estado) {
    if (sinConexion) return;
    setErrorAccion(null);

    try {
      const resultado = await marcarEstado(pedido.id, linea.id, estado);
      if (resultado?.pedidoCompletado) {
        setAvisosCompletados((actuales) => {
          const yaExiste = actuales.some(
            (aviso) => aviso.pedidoId === pedido.id && aviso.lineaId === linea.id,
          );
          if (yaExiste) return actuales;
          return [...actuales, { pedidoId: pedido.id, lineaId: linea.id }];
        });
      }
      try {
        const datosPedidos = await obtenerPedidosPendientes(partida);
        setPedidos(datosPedidos);
      } catch {
        // El aviso ya está disponible aunque falle la recarga de la lista.
      }
    } catch (fallo) {
      setErrorAccion(fallo.message ?? 'No se pudo cambiar el estado del plato');
    }
  }

  return (
    <Box>
      <Heading size="lg" mb={1}>
        Pedidos pendientes
      </Heading>
      <Text color="gray.600" mb={6}>
        {partida ? `Partida: ${NOMBRES_PARTIDA[partida] ?? partida}` : 'Vista de cocina'}
      </Text>

      {sinConexion && <AvisoSinConexion />}

      {avisosCompletados.map((aviso) => (
        <AvisoPedidoCompletado
          key={`${aviso.pedidoId}-${aviso.lineaId}`}
          pedidoId={aviso.pedidoId}
          lineaId={aviso.lineaId}
          onDeshacer={({ pedidoId, lineaId }) =>
            cambiarEstado({ id: pedidoId }, { id: lineaId }, 'pendiente')
          }
          onCerrar={() =>
            setAvisosCompletados((actuales) =>
              actuales.filter(
                (item) => item.pedidoId !== aviso.pedidoId || item.lineaId !== aviso.lineaId,
              ),
            )
          }
        />
      ))}

      {errorAccion && (
        <Alert status="error" borderRadius="md" mb={4}>
          <AlertIcon />
          <AlertDescription>{errorAccion}</AlertDescription>
        </Alert>
      )}

      {cargando && <EstadoCarga />}

      {!cargando && error && (
        <EstadoError mensaje={error} onReintentar={() => setIntento((valor) => valor + 1)} />
      )}

      {!cargando && !error && partida === null && <EstadoSinPartida />}

      {!cargando && !error && partida !== null && pedidos.length === 0 && <EstadoVacio />}

      {!cargando && !error && partida !== null && pedidos.length > 0 && (
        <Stack spacing={4}>
          {pedidos.map((pedido) => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              onMarcarListo={(linea) => cambiarEstado(pedido, linea, 'listo')}
              onDeshacer={(linea) => cambiarEstado(pedido, linea, 'pendiente')}
              deshabilitado={sinConexion}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
