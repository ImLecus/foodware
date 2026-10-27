export const PARTIDAS = ['entrantes', 'principales', 'postres'];

export const NOMBRES_PARTIDA = {
  entrantes: 'Entrantes',
  principales: 'Principales',
  postres: 'Postres',
};

/** Agrupa las líneas de un pedido por partida. */
export function agruparPorPartida(lineas = []) {
  const grupos = { entrantes: [], principales: [], postres: [] };
  for (const linea of lineas) {
    if (grupos[linea.partida]) {
      grupos[linea.partida].push(linea);
    }
  }
  return grupos;
}
