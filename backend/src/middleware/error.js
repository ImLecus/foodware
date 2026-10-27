/** Error de aplicación con un código HTTP y un código estable opcional. */
export class ErrorHttp extends Error {
  constructor(status, mensaje, codigo = null, datos = null) {
    super(mensaje);
    this.name = 'ErrorHttp';
    this.status = status;
    this.codigo = codigo;
    this.datos = datos;
  }
}

const CODIGOS_POR_ESTADO = {
  400: 'solicitud_invalida',
  401: 'no_autenticado',
  403: 'prohibido',
  404: 'no_encontrado',
  409: 'conflicto',
  423: 'bloqueado',
  500: 'error_interno',
};

export function noEncontrado(req, res) {
  const mensaje = 'Recurso no encontrado';
  // `error` se mantiene como alias para los contratos de las historias 001 y 002.
  res.status(404).json({ codigo: 'recurso_no_encontrado', mensaje, error: mensaje });
}

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(error, req, res, next) {
  const estado = error.status ?? 500;
  if (estado >= 500) {
    console.error(error);
  }
  const mensaje =
    estado >= 500 ? 'Error interno del servidor' : error.message || 'Error en la solicitud';
  const codigo = error.codigo ?? CODIGOS_POR_ESTADO[estado] ?? 'error_http';
  res.status(estado).json({
    codigo,
    mensaje,
    error: mensaje,
    ...(error.datos ?? {}),
  });
}
