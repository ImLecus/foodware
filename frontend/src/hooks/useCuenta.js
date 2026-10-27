import { useCallback, useEffect, useState } from 'react';
import { cerrarCuentaUnica, dividirCuenta, obtenerCuenta } from '../services/api.js';

function esSinConexion(error) {
  return !error?.status;
}

/** Carga la cuenta abierta de una mesa y permite cerrarla con un pago único. */
export function useCuenta(mesaId) {
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(Boolean(mesaId));
  const [error, setError] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [confirmandoDivision, setConfirmandoDivision] = useState(false);

  const recargar = useCallback(async () => {
    if (!mesaId) {
      setCuenta(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      const datos = await obtenerCuenta(mesaId);
      setCuenta(datos);
      setError(null);
      setSinConexion(false);
    } catch (err) {
      if (esSinConexion(err)) {
        setSinConexion(true);
      } else {
        setError(err);
      }
    } finally {
      setCargando(false);
    }
  }, [mesaId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const cerrar = useCallback(async () => {
    if (!cuenta) return null;

    setCerrando(true);
    try {
      const resultado = await cerrarCuentaUnica(mesaId, cuenta.total_centimos);
      setCuenta((actual) => ({
        ...actual,
        estado: 'cerrada',
        ticket_estado: 'emitido',
      }));
      setError(null);
      setSinConexion(false);
      return resultado;
    } catch (err) {
      if (esSinConexion(err)) {
        setSinConexion(true);
      } else {
        setError(err);
      }
      throw err;
    } finally {
      setCerrando(false);
    }
  }, [cuenta, mesaId]);

  const dividir = useCallback(
    async (division) => {
      setConfirmandoDivision(true);
      try {
        const resultado = await dividirCuenta(mesaId, division);
        setCuenta((actual) => ({
          ...actual,
          ...resultado.cuenta,
          division: resultado.division,
          ticket_estado: 'no_emitido',
        }));
        setError(null);
        setSinConexion(false);
        return resultado;
      } catch (err) {
        if (esSinConexion(err)) {
          setSinConexion(true);
        } else {
          setError(err);
        }
        throw err;
      } finally {
        setConfirmandoDivision(false);
      }
    },
    [mesaId],
  );

  return {
    cuenta,
    cargando,
    error,
    sinConexion,
    cerrando,
    confirmandoDivision,
    recargar,
    cerrar,
    dividir,
  };
}
