import { useCallback, useEffect, useState } from 'react';
import {
  cerrarCuentaUnica,
  deshacerPagoParte,
  dividirCuenta,
  obtenerCuenta,
  pagarParte as pagarParteApi,
} from '../services/api.js';

function esSinConexion(error) {
  return !error?.status;
}

function conParteActualizada(cuenta, parte) {
  if (!cuenta?.division) return cuenta;

  return {
    ...cuenta,
    division: {
      ...cuenta.division,
      partes: cuenta.division.partes.map((actual) => (actual.id === parte.id ? parte : actual)),
    },
  };
}

/** Carga la cuenta de una mesa, la divide y cobra sus partes o el pago único. */
export function useCuenta(mesaId) {
  const [cuenta, setCuenta] = useState(null);
  const [cargando, setCargando] = useState(Boolean(mesaId));
  const [error, setError] = useState(null);
  const [sinConexion, setSinConexion] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [confirmandoDivision, setConfirmandoDivision] = useState(false);
  const [pagandoParteId, setPagandoParteId] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [ticketEstado, setTicketEstado] = useState('no_emitido');

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
      setTicket(null);
      setTicketEstado(datos.ticket_estado ?? 'no_emitido');
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
      setTicket(resultado?.ticket ?? null);
      setTicketEstado('emitido');
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
        setTicket(null);
        setTicketEstado('no_emitido');
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

  const pagarParte = useCallback(
    async (parteId) => {
      setPagandoParteId(parteId);
      try {
        const resultado = await pagarParteApi(mesaId, parteId);
        setCuenta((actual) => ({
          ...conParteActualizada(actual, resultado.parte),
          estado: resultado.mesa_abierta ? actual.estado : 'cerrada',
          ticket_estado: resultado.ticket_estado,
        }));
        setTicket(resultado.ticket ?? null);
        setTicketEstado(resultado.ticket_estado);
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
        setPagandoParteId(null);
      }
    },
    [mesaId],
  );

  const deshacerPago = useCallback(
    async (parteId) => {
      setPagandoParteId(parteId);
      try {
        const resultado = await deshacerPagoParte(mesaId, parteId);
        setCuenta((actual) => ({
          ...conParteActualizada(actual, resultado.parte),
          ticket_estado: 'no_emitido',
        }));
        setTicket(null);
        setTicketEstado('no_emitido');
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
        setPagandoParteId(null);
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
    pagandoParteId,
    ticket,
    ticketEstado,
    recargar,
    cerrar,
    dividir,
    pagarParte,
    deshacerPago,
  };
}
