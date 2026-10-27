/** Minutos transcurridos desde el envío original, con el reloj local. */
export function calcularMinutos(enviadoEn, ahora = Date.now()) {
  const envio = new Date(enviadoEn).getTime();
  return Math.max(0, Math.floor((ahora - envio) / 60_000));
}

/** Texto legible del tiempo de espera en español de España. */
export function formatearEspera(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}
