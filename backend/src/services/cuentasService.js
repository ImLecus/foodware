import { randomUUID } from 'node:crypto';
import { obtenerMesa } from '../db/mesas.js';
import { listarLineasPendientesDePedido, obtenerPedidoActual } from '../db/pedidos.js';
import { exigirMesa } from '../domain/pedidos.js';
import { ErrorHttp } from '../middleware/error.js';
import { emitirMesaCerrada } from '../realtime/emit.js';
import { aISO } from '../utils/fechas.js';
import { validarDivisionIguales, validarDivisionPorConsumo } from './divisionService.js';
import { componerTicket, estadoTicket } from './ticketService.js';

const CONSUMOS_DE_PEDIDO = `
  SELECT l.id AS linea_id,
         l.pedido_id,
         p.nombre,
         l.cantidad,
         p.partida_codigo AS partida,
         l.precio_centimos,
         l.estado,
         l.listo_en,
         l.cantidad * l.precio_centimos AS importe_centimos
    FROM lineas_pedido l
    JOIN pedidos pe ON pe.id = l.pedido_id
    JOIN platos p ON p.id = l.plato_id
   WHERE l.pedido_id = ?
   ORDER BY l.rowid
`;

/** Suma los importes de los consumos, en céntimos. */
export function calcularTotal(consumos) {
  return consumos.reduce((total, consumo) => total + consumo.cantidad * consumo.precio_centimos, 0);
}

export function listarConsumos(db, pedidoId) {
  return db
    .prepare(CONSUMOS_DE_PEDIDO)
    .all(pedidoId)
    .map((consumo) => ({ ...consumo, listo_en: aISO(consumo.listo_en) }));
}

export function listarPlatosPendientes(db, pedidoId) {
  return listarLineasPendientesDePedido(db, pedidoId).map((linea) => ({
    linea_id: linea.linea_id,
    nombre: linea.nombre,
    partida: linea.partida,
    estado: linea.estado,
  }));
}

function exigirSinPlatosPendientes(db, pedidoId) {
  const platos = listarPlatosPendientes(db, pedidoId);
  if (platos.length > 0) {
    throw new ErrorHttp(409, 'Hay platos pendientes en cocina', 'platos_pendientes', { platos });
  }
  return platos;
}

function obtenerCuentaPersistida(db, mesaId, pedidoId) {
  return (
    db
      .prepare(
        `SELECT id, mesa_id, pedido_id, estado, total_centimos, modo_division, abierta_en, cerrada_en
           FROM cuentas
          WHERE mesa_id = ?
            AND pedido_id = ?
          ORDER BY abierta_en DESC
          LIMIT 1`,
      )
      .get(mesaId, pedidoId) ?? null
  );
}

function obtenerCuentaMasReciente(db, mesaId) {
  return (
    db
      .prepare(
        `SELECT id, mesa_id, pedido_id, estado, total_centimos, modo_division, abierta_en, cerrada_en
           FROM cuentas
          WHERE mesa_id = ?
          ORDER BY abierta_en DESC
          LIMIT 1`,
      )
      .get(mesaId) ?? null
  );
}

function obtenerDivision(db, cuenta) {
  if (!cuenta?.modo_division) return null;

  const partes = db
    .prepare(
      `SELECT id, orden, comensal, importe_centimos, estado, pagada_en
         FROM cuentas_partes
        WHERE cuenta_id = ?
        ORDER BY orden`,
    )
    .all(cuenta.id)
    .map(serializarParte);

  const asignaciones = db
    .prepare(
      `SELECT cpc.parte_id, cpc.linea_id, cpc.importe_centimos
         FROM cuentas_parte_consumos cpc
         JOIN cuentas_partes cp ON cp.id = cpc.parte_id
        WHERE cp.cuenta_id = ?
        ORDER BY cp.orden, cpc.linea_id`,
    )
    .all(cuenta.id);

  return { modo: cuenta.modo_division, partes, asignaciones };
}

function serializarParte(parte) {
  return {
    id: parte.id,
    orden: parte.orden,
    comensal: parte.comensal,
    importe_centimos: parte.importe_centimos,
    estado: parte.estado,
    pagada_en: aISO(parte.pagada_en),
  };
}

function exigirCuentaAbierta(mesa, cuenta) {
  if (mesa.estado === 'cerrada' || cuenta?.estado === 'cerrada') {
    throw new ErrorHttp(409, 'La cuenta ya está cerrada', 'cuenta_cerrada');
  }
}

function obtenerCuentaDividida(db, mesaId) {
  const pedido = obtenerPedidoActual(db, mesaId);
  if (!pedido) {
    const ultima = obtenerCuentaMasReciente(db, mesaId);
    if (ultima?.estado === 'cerrada') {
      throw new ErrorHttp(409, 'La cuenta ya está cerrada', 'cuenta_cerrada');
    }
    throw new ErrorHttp(404, 'No hay una comanda activa para esta mesa');
  }

  const cuenta = obtenerCuentaPersistida(db, mesaId, pedido.id);
  if (!cuenta?.modo_division) {
    throw new ErrorHttp(404, 'La cuenta no tiene una división confirmada');
  }
  return { cuenta, pedido };
}

/**
 * Descarta la división confirmada de una mesa porque la cuenta ha cambiado
 * (FR-017). Las partes y las asignaciones se borran en cascada.
 */
export function descartarDivision(db, mesaId) {
  db.prepare("DELETE FROM cuentas WHERE mesa_id = ? AND estado = 'abierta'").run(mesaId);
}

/**
 * Si la división persistida ya no cuadra con los consumos actuales, la descarta
 * para que `GET /cuenta` nunca devuelva partes que no sumen el total.
 */
function descartarDivisionObsoleta(db, cuenta, totalCentimos) {
  if (!cuenta?.modo_division || cuenta.total_centimos === totalCentimos) {
    return cuenta;
  }
  db.prepare('DELETE FROM cuentas WHERE id = ?').run(cuenta.id);
  return null;
}

function obtenerParte(db, cuenta, parteId) {
  const parte = db
    .prepare(
      `SELECT id, orden, comensal, importe_centimos, estado, pagada_en
         FROM cuentas_partes
        WHERE id = ? AND cuenta_id = ?`,
    )
    .get(parteId, cuenta.id);

  if (!parte) {
    throw new ErrorHttp(404, 'Parte de la cuenta no encontrada');
  }
  return parte;
}

/**
 * Comprueba que los consumos siguen sumando el total de la división. Si la
 * cuenta cambió, descarta la división para que el camarero la rehaga (FR-017).
 */
function exigirTotalVigente(db, pedidoId, cuenta) {
  const total = calcularTotal(listarConsumos(db, pedidoId));
  if (total !== cuenta.total_centimos) {
    db.prepare('DELETE FROM cuentas WHERE id = ?').run(cuenta.id);
    throw new ErrorHttp(
      422,
      'El total de la cuenta ha cambiado: hay que rehacer la división',
      'total_desactualizado',
    );
  }
  return total;
}

function leerCuenta(db, cuentaId) {
  return db
    .prepare(
      `SELECT id, mesa_id, pedido_id, estado, total_centimos, modo_division, cerrada_en
         FROM cuentas
        WHERE id = ?`,
    )
    .get(cuentaId);
}

/** Cuenta abierta derivada de los consumos, con la división ya confirmada si existe. */
export function obtenerCuenta(db, mesaId) {
  const mesa = exigirMesa(obtenerMesa(db, mesaId));
  const pedido = obtenerPedidoActual(db, mesaId);

  if (!pedido) {
    const ultima = obtenerCuentaMasReciente(db, mesaId);
    if (ultima?.estado === 'cerrada') {
      throw new ErrorHttp(409, 'La cuenta ya está cerrada', 'cuenta_cerrada');
    }

    return {
      mesa_id: mesa.id,
      identificador: mesa.identificador,
      pedido_id: null,
      estado: 'abierta',
      total_centimos: 0,
      consumos: [],
      platos_pendientes: [],
      division: null,
      ticket_estado: 'no_emitido',
    };
  }

  const persistida = obtenerCuentaPersistida(db, mesa.id, pedido.id);
  exigirCuentaAbierta(mesa, persistida);

  const consumos = listarConsumos(db, pedido.id);
  const total = calcularTotal(consumos);
  const division = descartarDivisionObsoleta(db, persistida, total);

  return {
    mesa_id: mesa.id,
    identificador: mesa.identificador,
    pedido_id: pedido.id,
    estado: 'abierta',
    total_centimos: total,
    consumos,
    platos_pendientes: listarPlatosPendientes(db, pedido.id),
    division: obtenerDivision(db, division),
    ticket_estado: estadoTicket(division),
  };
}

/**
 * Cobro único: cierra la cuenta y libera la mesa en una transacción. El importe
 * debe coincidir con el total actual y no puede haber platos pendientes.
 */
export function cerrarCuentaUnica(db, mesaId, { totalBaseCentimos, camareroId = null }) {
  const mesa = exigirMesa(obtenerMesa(db, mesaId));
  const pedido = obtenerPedidoActual(db, mesaId);

  if (!pedido) {
    const ultima = obtenerCuentaMasReciente(db, mesaId);
    if (ultima?.estado === 'cerrada') {
      throw new ErrorHttp(409, 'La cuenta ya está cerrada', 'cuenta_cerrada');
    }
    throw new ErrorHttp(404, 'No hay una comanda activa para esta mesa');
  }

  const persistida = obtenerCuentaPersistida(db, mesa.id, pedido.id);
  exigirCuentaAbierta(mesa, persistida);

  if (persistida?.modo_division) {
    throw new ErrorHttp(
      409,
      'La cuenta está dividida: ciérrala pagando cada parte',
      'cuenta_dividida',
    );
  }

  const total = calcularTotal(listarConsumos(db, pedido.id));
  if (total === 0) {
    throw new ErrorHttp(422, 'No se puede cerrar una cuenta sin importe', 'cuenta_vacia');
  }
  if (totalBaseCentimos !== total) {
    throw new ErrorHttp(
      422,
      'El total de la cuenta ha cambiado: vuelve a revisarlo',
      'total_desactualizado',
    );
  }

  exigirSinPlatosPendientes(db, pedido.id);

  const id = randomUUID();
  const cerrar = db.transaction(() => {
    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, pedido_id, camarero_id, estado, total_centimos, modo_division, cerrada_en)
       VALUES (?, ?, ?, ?, 'cerrada', ?, 'unico', datetime('now'))`,
    ).run(id, mesaId, pedido.id, camareroId, total);
    db.prepare("UPDATE mesas SET estado = 'libre' WHERE id = ?").run(mesaId);
    db.prepare("UPDATE pedidos SET estado = 'cerrada' WHERE id = ?").run(pedido.id);
  });
  cerrar();

  const cuenta = leerCuenta(db, id);

  emitirMesaCerrada({ mesaId, cuentaId: cuenta.id, cerradaEn: aISO(cuenta.cerrada_en) });

  return {
    cuenta: {
      id: cuenta.id,
      mesa_id: cuenta.mesa_id,
      pedido_id: cuenta.pedido_id,
      estado: cuenta.estado,
      total_centimos: cuenta.total_centimos,
      cerrada_en: aISO(cuenta.cerrada_en),
    },
    ticket_estado: 'emitido',
    ticket: componerTicket(db, cuenta),
    mesa_estado: 'libre',
  };
}

/**
 * Confirma la división de la cuenta pendiente de cobro. Persiste la cuenta en
 * estado abierta, sus partes y, en modo por consumo, las asignaciones. No cierra
 * la mesa ni emite ticket: eso ocurre al pagar la última parte.
 */
export function confirmarDivision(db, mesaId, datos) {
  const mesa = exigirMesa(obtenerMesa(db, mesaId));
  const pedido = obtenerPedidoActual(db, mesaId);

  if (!pedido) {
    throw new ErrorHttp(404, 'No hay una comanda activa para esta mesa');
  }

  const persistida = obtenerCuentaPersistida(db, mesa.id, pedido.id);
  exigirCuentaAbierta(mesa, persistida);

  if (persistida?.modo_division) {
    const pagadas = db
      .prepare(
        "SELECT COUNT(*) AS total FROM cuentas_partes WHERE cuenta_id = ? AND estado = 'pagada'",
      )
      .get(persistida.id).total;
    if (pagadas > 0) {
      throw new ErrorHttp(
        409,
        'La división ya tiene partes pagadas: no se puede rehacer',
        'division_con_pagos',
      );
    }
  }

  const consumos = listarConsumos(db, pedido.id);
  const total = calcularTotal(consumos);

  if (datos.totalBaseCentimos !== total) {
    throw new ErrorHttp(
      422,
      'El total de la cuenta ha cambiado: vuelve a revisarlo',
      'total_desactualizado',
    );
  }

  const partes = [...datos.partes].sort((a, b) => a.orden - b.orden);
  if (datos.modo === 'iguales') {
    validarDivisionIguales({ totalCentimos: total, partes });
  } else {
    validarDivisionPorConsumo({
      totalCentimos: total,
      consumos,
      partes,
      asignaciones: datos.asignaciones,
    });
  }

  const cuentaId = randomUUID();
  const idsPorOrden = new Map();

  const guardar = db.transaction(() => {
    if (persistida) {
      db.prepare('DELETE FROM cuentas WHERE id = ?').run(persistida.id);
    }

    db.prepare(
      `INSERT INTO cuentas (id, mesa_id, pedido_id, estado, total_centimos, modo_division)
       VALUES (?, ?, ?, 'abierta', ?, ?)`,
    ).run(cuentaId, mesaId, pedido.id, total, datos.modo);

    for (const parte of partes) {
      const parteId = randomUUID();
      idsPorOrden.set(parte.orden, parteId);
      db.prepare(
        `INSERT INTO cuentas_partes (id, cuenta_id, orden, comensal, importe_centimos)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(parteId, cuentaId, parte.orden, parte.comensal.trim(), parte.importe_centimos);
    }

    for (const asignacion of datos.asignaciones) {
      db.prepare(
        `INSERT INTO cuentas_parte_consumos (id, parte_id, linea_id, importe_centimos)
         VALUES (?, ?, ?, ?)`,
      ).run(
        randomUUID(),
        idsPorOrden.get(asignacion.parte_orden),
        asignacion.linea_id,
        asignacion.importe_centimos,
      );
    }
  });
  guardar();

  const cuenta = leerCuenta(db, cuentaId);

  return {
    cuenta: {
      id: cuenta.id,
      mesa_id: cuenta.mesa_id,
      pedido_id: cuenta.pedido_id,
      estado: cuenta.estado,
      total_centimos: cuenta.total_centimos,
      modo_division: cuenta.modo_division,
      ticket_estado: 'no_emitido',
    },
    division: obtenerDivision(db, cuenta),
  };
}

/**
 * Marca una parte como pagada. Si era la última pendiente, cierra la cuenta y
 * libera la mesa en la misma transacción y emite el único ticket final.
 */
export function pagarParte(db, mesaId, parteId, { camareroId = null } = {}) {
  const mesa = exigirMesa(obtenerMesa(db, mesaId));
  const { cuenta, pedido } = obtenerCuentaDividida(db, mesaId);

  exigirCuentaAbierta(mesa, cuenta);
  const parte = obtenerParte(db, cuenta, parteId);

  if (parte.estado === 'pagada') {
    throw new ErrorHttp(409, 'La parte ya está pagada', 'parte_pagada');
  }

  exigirTotalVigente(db, pedido.id, cuenta);

  const pendientes = db
    .prepare(
      "SELECT COUNT(*) AS total FROM cuentas_partes WHERE cuenta_id = ? AND estado = 'pendiente'",
    )
    .get(cuenta.id).total;

  if (pendientes === 1) {
    exigirSinPlatosPendientes(db, pedido.id);
  }

  const marcar = db.transaction(() => {
    db.prepare(
      "UPDATE cuentas_partes SET estado = 'pagada', pagada_en = datetime('now') WHERE id = ?",
    ).run(parte.id);

    if (pendientes === 0) {
      throw new ErrorHttp(409, 'La cuenta ya está cerrada', 'cuenta_cerrada');
    }

    if (pendientes === 1) {
      db.prepare(
        "UPDATE cuentas SET estado = 'cerrada', cerrada_en = datetime('now'), camarero_id = COALESCE(?, camarero_id) WHERE id = ?",
      ).run(camareroId, cuenta.id);
      db.prepare("UPDATE mesas SET estado = 'libre' WHERE id = ?").run(mesaId);
      db.prepare("UPDATE pedidos SET estado = 'cerrada' WHERE id = ?").run(pedido.id);
    }
  });
  marcar();

  const cuentaFinal = leerCuenta(db, cuenta.id);
  const parteFinal = obtenerParte(db, cuentaFinal, parte.id);
  const ticket = componerTicket(db, cuentaFinal);

  if (cuentaFinal.estado === 'cerrada') {
    emitirMesaCerrada({
      mesaId,
      cuentaId: cuentaFinal.id,
      cerradaEn: aISO(cuentaFinal.cerrada_en),
    });
  }

  return {
    parte: serializarParte(parteFinal),
    ticket_estado: estadoTicket(cuentaFinal),
    ticket,
    mesa_abierta: cuentaFinal.estado !== 'cerrada',
    mesa_estado: cuentaFinal.estado === 'cerrada' ? 'libre' : 'ocupada',
  };
}

/** Deshace el pago de una parte mientras la cuenta siga abierta. */
export function deshacerPagoParte(db, mesaId, parteId) {
  const mesa = exigirMesa(obtenerMesa(db, mesaId));
  const { cuenta } = obtenerCuentaDividida(db, mesaId);

  exigirCuentaAbierta(mesa, cuenta);
  const parte = obtenerParte(db, cuenta, parteId);

  if (parte.estado !== 'pagada') {
    throw new ErrorHttp(409, 'La parte ya está pendiente', 'parte_pendiente');
  }

  exigirTotalVigente(db, cuenta.pedido_id, cuenta);

  db.prepare("UPDATE cuentas_partes SET estado = 'pendiente', pagada_en = NULL WHERE id = ?").run(
    parte.id,
  );

  const parteFinal = obtenerParte(db, cuenta, parte.id);

  return {
    parte: serializarParte(parteFinal),
    ticket_estado: 'no_emitido',
    ticket: null,
    mesa_abierta: true,
    mesa_estado: 'ocupada',
  };
}

/** Ticket de la última cuenta cerrada de la mesa; antes del cierre no existe. */
export function obtenerTicket(db, mesaId) {
  exigirMesa(obtenerMesa(db, mesaId));
  const cuenta = db
    .prepare(
      `SELECT id, mesa_id, pedido_id, estado, total_centimos, modo_division, cerrada_en
         FROM cuentas
        WHERE mesa_id = ? AND estado = 'cerrada'
        ORDER BY cerrada_en DESC
        LIMIT 1`,
    )
    .get(mesaId);

  if (!cuenta) {
    throw new ErrorHttp(409, 'El ticket aún no se ha emitido', 'ticket_no_emitido');
  }

  return componerTicket(db, cuenta);
}
