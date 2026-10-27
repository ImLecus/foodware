import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerMesasSala } from '../services/api.js';
import { suscribirASala } from '../services/realtime.js';

export function useSala() {
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  const mesasRef = useRef([]);

  const actualizarMesas = useCallback((siguiente) => {
    const lista = Array.isArray(siguiente) ? siguiente : [];
    mesasRef.current = lista;
    setMesas(lista);
  }, []);

  const recargar = useCallback(async () => {
    try {
      const respuesta = await obtenerMesasSala();
      actualizarMesas(respuesta?.mesas ?? []);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }, [actualizarMesas]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  useEffect(() => {
    const cerrar = suscribirASala({
      onEstadoConexion: (estado) => {
        if (estado === 'sin-conexion') {
          setSinConexion(true);
          return;
        }
        setSinConexion(false);
        recargar();
      },
      onEvento: (nombre, datos) => {
        if (nombre === 'linea.actualizada') {
          const { lineaId, estado } = datos || {};
          if (!lineaId) return;

          setMesas((actual) =>
            actual.map((mesa) => ({
              ...mesa,
              platos: (mesa.platos || []).map((plato) =>
                plato.id === lineaId ? { ...plato, estado } : plato,
              ),
            })),
          );
          return;
        }

        if (nombre === 'aviso.activo' || nombre === 'aviso.retirado' || nombre === 'aviso.descartado') {
          recargar();
          return;
        }

        if (
          nombre === 'pedido-confirmado' ||
          nombre === 'pedido-modificado' ||
          nombre === 'pedido-anulado' ||
          nombre === 'pedido.reabierto' ||
          nombre === 'pedido.pendientes-cambiado'
        ) {
          recargar();
        }
      },
    });

    return cerrar;
  }, [recargar]);

  const descartarAviso = useCallback(async (avisoId) => {
    void avisoId;
  }, []);

  return {
    mesas,
    cargando,
    error,
    sinConexion,
    descartarAviso,
    recargar,
  };
}
