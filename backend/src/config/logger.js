function escribir(nivel, mensaje, datos = {}) {
  const linea = JSON.stringify({ nivel, mensaje, ...datos, momento: new Date().toISOString() });
  if (nivel === 'error') {
    console.error(linea);
  } else {
    console.log(linea);
  }
}

export const logger = {
  info: (mensaje, datos) => escribir('info', mensaje, datos),
  error: (mensaje, datos) => escribir('error', mensaje, datos),
};
