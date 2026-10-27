/** Reparte un total en céntimos entre N partes, dando el sobrante a las primeras. */
export function repartirEnPartesIguales(totalCentimos, numeroPartes) {
  const partes = Math.max(1, Number(numeroPartes) || 1);
  const base = Math.floor(totalCentimos / partes);
  const sobrante = totalCentimos % partes;

  return Array.from({ length: partes }, (_, indice) => base + (indice < sobrante ? 1 : 0));
}
