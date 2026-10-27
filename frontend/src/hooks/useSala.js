import { useCallback, useEffect, useRef, useState } from 'react';
import { descartarAvisoSala, obtenerMesasSala } from '../services/api.js';
import { suscribirASala } from '../services/realtime.js';
import { guardarSilenciado, leerSilenciado, reproducirPitido } from '../utils/sonido.js';

export function useSala() {
  const [mesas, setMesas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [silenciado, setSilenciado] = useState(() => leerSilenciado());
  const mesasRef = useRef([]);
  const silenciadoRef = useRef(silenciado);
  const avisosSonados = useRef(new Set());

  useEffect(() => {
    silenciadoRef.current = silenciado;
  }, [silenciado]);

  const actualizarMesas = useCallback((siguiente) => {
    const lista = Array.isArray(siguiente) ? siguiente : [];
    mesasRef.current = lista;
    setMesas(lista);
  }, []);

  const alternarSonido = useCallback(() => {
    setSilenciado((actual) => {
      const siguiente = !actual;
      silenciadoRef.current = siguiente;
      guardarSilenciado(siguiente);
      return siguiente;
    });
  }, []);

  /** Quita el aviso de su mesa sin esperar a la siguiente instantánea. */
  const quitarAviso = useCallback((avisoId) => {
    if (!avisoId) return;
    setMesas((actual) =>
      actual.map((mesa) => (mesa.aviso?.id === avisoId ? { ...mesa, aviso: null } : mesa)),
    );
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

        if (nombre === 'aviso.activo') {
          const avisoId = datos?.aviso_id;
          if (
            avisoId &&
            !silenciadoRef.current &&
            !avisosSonados.current.has(avisoId)
          ) {
            avisosSonados.current.add(avisoId);
            reproducirPitido();
          }
          recargar();
          return;
        }

        if (nombre === 'aviso.retirado') {
          recargar();
          return;
        }

        if (nombre === 'aviso.descartado') {
          const avisoId = datos?.aviso_id;
          if (avisoId) {
            avisosSonados.current.delete(avisoId);
            quitarAviso(avisoId);
          }
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
  }, [quitarAviso, recargar]);

  const descartarAviso = useCallback(
    async (avisoId) => {
      if (!avisoId || sinConexion) return;

      try {
        await descartarAvisoSala(avisoId);
        quitarAviso(avisoId);
      } catch (err) {
        if (err?.status === 404) {
          quitarAviso(avisoId);
          return;
        }
        // Sin conexión se conserva el aviso; al resincronizar se reintenta.
      }
    },
    [quitarAviso, sinConexion],
  );

  return {
    mesas,
    cargando,
    error,
    sinConexion,
    silenciado,
    alternarSonido,
    descartarAviso,
    recargar,
  };
}
