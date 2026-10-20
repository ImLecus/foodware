import { useEffect, useState } from 'react';
import { obtenerEstadoPlatos } from '../services/api.js';
import { suscribirSala } from '../services/events.js';

/** Estado de los platos de una mesa, actualizado por SSE. */
export function useEstadoPlatos(mesaId) {
  const [lineas, setLineas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      setCargando(true);
      setError(null);
      try {
        const datos = await obtenerEstadoPlatos(mesaId);
        if (!cancelado) setLineas(datos);
      } catch (fallo) {
        if (!cancelado) setError(fallo.message ?? 'No se pudo cargar el estado de la mesa');
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();

    return () => {
      cancelado = true;
    };
  }, [mesaId]);

  useEffect(
    () =>
      suscribirSala({
        onEvento: () => {
          obtenerEstadoPlatos(mesaId)
            .then((datos) => setLineas(datos))
            .catch(() => {
              // Se conserva la última información conocida.
            });
        },
      }),
    [mesaId],
  );

  return { lineas, cargando, error };
}
