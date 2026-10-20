export function noEncontrado(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(error, req, res, next) {
  const estado = error.status ?? 500;
  if (estado >= 500) {
    console.error(error);
  }
  res.status(estado).json({
    error: estado >= 500 ? 'Error interno del servidor' : error.message,
  });
}
