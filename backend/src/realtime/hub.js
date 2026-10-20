const clientes = new Set();
const latidos = new Map();

/**
 * Suscribe una respuesta HTTP al canal SSE compartido.
 * El cliente recibe un comentario inicial y un latido periódico.
 */
export function suscribir(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': conectado\n\n');
  clientes.add(res);

  const latido = setInterval(() => {
    res.write(': ping\n\n');
  }, 25_000);
  latidos.set(res, latido);

  const cerrar = () => {
    clearInterval(latidos.get(res));
    latidos.delete(res);
    clientes.delete(res);
  };

  req.on('close', cerrar);
  req.on('error', cerrar);
}

/** Difunde un evento a todos los clientes conectados. */
export function publicar(evento, datos) {
  const mensaje = `event: ${evento}\ndata: ${JSON.stringify(datos)}\n\n`;
  for (const cliente of clientes) {
    cliente.write(mensaje);
  }
}

export function numeroDeClientes() {
  return clientes.size;
}

/** Solo para pruebas: cierra y limpia todas las suscripciones. */
export function reiniciarHub() {
  for (const [cliente, latido] of latidos.entries()) {
    clearInterval(latido);
    try {
      cliente.end();
    } catch {
      // El cliente ya puede estar cerrado.
    }
  }
  latidos.clear();
  clientes.clear();
}
