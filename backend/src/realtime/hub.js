import { logger } from '../config/logger.js';

/** Clientes SSE: respuesta HTTP -> canal y temporizador de latido. */
const clientes = new Map();

function canalDe(opciones) {
  if (!opciones) return null;
  if (typeof opciones === 'string') {
    return opciones.includes(':') ? opciones : `partida:${opciones}`;
  }
  if (opciones.partida) return `partida:${opciones.partida}`;
  if (opciones.mesaId) return `mesa:${opciones.mesaId}`;
  return null;
}

function cerrarCliente(res) {
  const cliente = clientes.get(res);
  if (!cliente) return;
  clearInterval(cliente.latido);
  clientes.delete(res);
}

function escribir(res, mensaje) {
  try {
    res.write(mensaje);
  } catch {
    cerrarCliente(res);
  }
}

/**
 * Suscribe una respuesta HTTP al canal SSE global, al canal de una partida o
 * al canal de una mesa. El cliente recibe un comentario inicial y un latido.
 */
export function suscribir(req, res, opciones = null) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': conectado\n\n');

  const latido = setInterval(() => {
    escribir(res, ': ping\n\n');
  }, 25_000);
  clientes.set(res, { canal: canalDe(opciones), latido });

  const cerrar = () => cerrarCliente(res);
  req.on('close', cerrar);
  req.on('error', cerrar);
}

function identificadoresDe(datos) {
  const identificadores = {};
  for (const clave of ['pedidoId', 'lineaId', 'mesaId', 'aviso_id', 'mesa_id']) {
    if (datos[clave] !== undefined) identificadores[clave] = datos[clave];
  }
  return identificadores;
}

/**
 * Difunde un evento a los clientes globales y a los canales de partida/mesa
 * que correspondan. Los clientes de otros canales no lo reciben.
 */
export function publicar(evento, datos = {}) {
  const mensaje = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  const canales = new Set();
  if (datos.partida) canales.add(`partida:${datos.partida}`);
  if (datos.mesaId) canales.add(`mesa:${datos.mesaId}`);
  if (datos.mesa_id) canales.add(`mesa:${datos.mesa_id}`);

  for (const [cliente, info] of clientes.entries()) {
    if (info.canal === null || canales.has(info.canal)) {
      escribir(cliente, mensaje);
    }
  }

  logger.info('Evento SSE emitido', {
    evento,
    partida: datos.partida ?? null,
    ...identificadoresDe(datos),
  });
}

export function numeroDeClientes() {
  return clientes.size;
}

/** Solo para pruebas: cierra y limpia todas las suscripciones. */
export function reiniciarHub() {
  for (const [cliente, info] of clientes.entries()) {
    clearInterval(info.latido);
    try {
      cliente.end();
    } catch {
      // El cliente ya puede estar cerrado.
    }
  }
  clientes.clear();
}
